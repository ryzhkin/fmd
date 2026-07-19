import { readFile, writeFile } from 'node:fs/promises';
import { createTreeDecorations, obstacleGeometry } from './tree-decorations.mjs';

const CENTER = [34.765046875, 50.8650625];
const EARTH_RADIUS_METERS = 6_378_137;
const REFERENCE_ZOOM = 16;
const FOOTPRINT_FILL = 0.94;
const METERS_PER_PIXEL_Z16 =
  (78271.51696402048 * Math.cos((CENTER[1] * Math.PI) / 180)) / 2 ** REFERENCE_ZOOM;

function toLocalMeters([lon, lat]) {
  const lonRadians = ((lon - CENTER[0]) * Math.PI) / 180;
  const latRadians = ((lat - CENTER[1]) * Math.PI) / 180;
  return [
    EARTH_RADIUS_METERS * lonRadians * Math.cos((CENTER[1] * Math.PI) / 180),
    EARTH_RADIUS_METERS * latRadians,
  ];
}

function fromLocalMeters([x, y]) {
  return [
    CENTER[0] + (x / (EARTH_RADIUS_METERS * Math.cos((CENTER[1] * Math.PI) / 180))) * (180 / Math.PI),
    CENTER[1] + (y / EARTH_RADIUS_METERS) * (180 / Math.PI),
  ];
}

function polygonAreaAndCentroid(points) {
  let doubledArea = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    doubledArea += cross;
    centroidX += (current[0] + next[0]) * cross;
    centroidY += (current[1] + next[1]) * cross;
  }

  if (Math.abs(doubledArea) < 0.001) {
    const average = points.reduce(
      (result, point) => [result[0] + point[0], result[1] + point[1]],
      [0, 0]
    );
    return {
      area: 0,
      centroid: [average[0] / points.length, average[1] / points.length],
    };
  }

  return {
    area: Math.abs(doubledArea) / 2,
    centroid: [centroidX / (3 * doubledArea), centroidY / (3 * doubledArea)],
  };
}


function classifyRoof(area, majorMeters, minorMeters, rectangularity, tags = {}) {
  const aspectRatio = minorMeters > 0 ? majorMeters / minorMeters : 1;
  const buildingType = String(tags.building ?? '').toLowerCase();

  if (rectangularity < 0.72 && area >= 70) return 'compound';
  if (
    area >= 240 ||
    majorMeters >= 25 ||
    ['apartments', 'commercial', 'retail', 'school', 'hospital', 'church', 'cathedral'].includes(buildingType)
  ) {
    return 'manor';
  }
  if (aspectRatio >= 2.05) return 'long';
  if (area <= 55 || majorMeters <= 8) return 'small';
  if (aspectRatio <= 1.25) return 'square';
  return 'cottage';
}

function buildingMetrics(coordinates, tags = {}) {
  const openRing = coordinates.length > 1 &&
    coordinates[0][0] === coordinates.at(-1)[0] &&
    coordinates[0][1] === coordinates.at(-1)[1]
    ? coordinates.slice(0, -1)
    : coordinates;
  const ring = openRing.map(toLocalMeters);
  if (ring.length < 3) return null;

  const { area, centroid } = polygonAreaAndCentroid(ring);
  const average = ring.reduce(
    (result, point) => [result[0] + point[0], result[1] + point[1]],
    [0, 0]
  ).map(value => value / ring.length);

  let covarianceXX = 0;
  let covarianceYY = 0;
  let covarianceXY = 0;
  for (const [x, y] of ring) {
    const dx = x - average[0];
    const dy = y - average[1];
    covarianceXX += dx * dx;
    covarianceYY += dy * dy;
    covarianceXY += dx * dy;
  }

  const angleRadians = 0.5 * Math.atan2(2 * covarianceXY, covarianceXX - covarianceYY);
  const majorAxis = [Math.cos(angleRadians), Math.sin(angleRadians)];
  const minorAxis = [-majorAxis[1], majorAxis[0]];

  let minMajor = Infinity;
  let maxMajor = -Infinity;
  let minMinor = Infinity;
  let maxMinor = -Infinity;

  for (const point of ring) {
    const majorProjection = point[0] * majorAxis[0] + point[1] * majorAxis[1];
    const minorProjection = point[0] * minorAxis[0] + point[1] * minorAxis[1];
    minMajor = Math.min(minMajor, majorProjection);
    maxMajor = Math.max(maxMajor, majorProjection);
    minMinor = Math.min(minMinor, minorProjection);
    maxMinor = Math.max(maxMinor, minorProjection);
  }

  let majorMeters = Math.max(1, maxMajor - minMajor);
  let minorMeters = Math.max(1, maxMinor - minMinor);
  let normalizedAngle = angleRadians;

  if (minorMeters > majorMeters) {
    [majorMeters, minorMeters] = [minorMeters, majorMeters];
    normalizedAngle += Math.PI / 2;
  }

  const boundingArea = majorMeters * minorMeters;
  const rectangularity = boundingArea > 0 ? Math.max(0, Math.min(1, area / boundingArea)) : 1;
  const roofStyle = classifyRoof(area, majorMeters, minorMeters, rectangularity, tags);
  const rotationDegrees = ((-(normalizedAngle * 180) / Math.PI) % 180 + 180) % 180;

  return {
    center: fromLocalMeters(centroid),
    centerLocal: centroid,
    majorAxis,
    minorAxis,
    roofStyle,
    rotationDegrees,
    area,
    majorMeters,
    minorMeters,
    aspectRatio: majorMeters / minorMeters,
    rectangularity,
    iconWidthZ16: (majorMeters / METERS_PER_PIXEL_Z16) * FOOTPRINT_FILL,
    iconHeightZ16: (minorMeters / METERS_PER_PIXEL_Z16) * FOOTPRINT_FILL,
  };
}

const filePath = 'data/map.geojson';
const geojson = JSON.parse(await readFile(filePath, 'utf8'));
const buildingIcons = [];
const buildings = [];

const retainedFeatures = geojson.features.filter(feature => {
  const properties = feature.properties ?? {};
  const isGeneratedFeature = ['building_icon', 'tree_decoration'].includes(properties.kind);
  const isLegacyBuildingIcon =
    feature.geometry?.type === 'Point' &&
    properties.kind === 'building' &&
    properties.fantasy_icon === '⌂';
  return !isGeneratedFeature && !isLegacyBuildingIcon;
});

for (const feature of retainedFeatures) {
  if (feature.geometry?.type !== 'Polygon' || feature.properties?.kind !== 'building') continue;
  const metrics = buildingMetrics(feature.geometry.coordinates?.[0] ?? [], feature.properties);
  if (!metrics) continue;

  const sourceId = feature.properties.osm_id;
  buildings.push({ feature, metrics, sourceId });
  buildingIcons.push({
    type: 'Feature',
    id: `building-icon/${sourceId}`,
    properties: {
      osm_id: `building-icon-${sourceId}`,
      source_osm_id: sourceId,
      kind: 'building_icon',
      building_icon: `procedural-house-${sourceId}`,
      roof_style: metrics.roofStyle,
      icon_width_z16: Number(metrics.iconWidthZ16.toFixed(4)),
      icon_height_z16: Number(metrics.iconHeightZ16.toFixed(4)),
      icon_rotate: Number(metrics.rotationDegrees.toFixed(2)),
      building_area_m2: Number(metrics.area.toFixed(1)),
      building_major_m: Number(metrics.majorMeters.toFixed(1)),
      building_minor_m: Number(metrics.minorMeters.toFixed(1)),
      building_aspect: Number(metrics.aspectRatio.toFixed(2)),
      building_rectangularity: Number(metrics.rectangularity.toFixed(3)),
    },
    geometry: { type: 'Point', coordinates: metrics.center },
  });
}

const obstacles = retainedFeatures.flatMap(feature => {
  const kind = feature.properties?.kind;
  const normalizedKind = kind === 'waterway' ? 'water' : kind;
  if (!['building', 'road', 'water'].includes(normalizedKind)) return [];
  const geometry = obstacleGeometry(feature, toLocalMeters);
  return geometry ? [{ ...geometry, kind: normalizedKind }] : [];
});
const treeDecorations = createTreeDecorations(buildings, obstacles, fromLocalMeters);

geojson.features = [...retainedFeatures, ...buildingIcons, ...treeDecorations];
geojson.metadata = {
  ...(geojson.metadata ?? {}),
  building_icons: 'unique procedural roofs sized from both footprint axes at reference zoom 16',
  tree_decorations: `${treeDecorations.length} deterministic trees placed near clear residential buildings`,
};

await writeFile(filePath, `${JSON.stringify(geojson)}\n`, 'utf8');
console.log(
  `Enriched ${buildingIcons.length} procedural building roofs and ${treeDecorations.length} tree decorations`
);
