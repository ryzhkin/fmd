import { createLocalProjection, polygonAreaAndCentroid } from './geometry.ts';
import { createTreeDecorations, obstacleGeometry } from './trees.ts';
import type { BuildingCandidate, BuildingMetrics, Obstacle } from './trees.ts';
import type { MapDataset, MapFeature, Position, RegionDefinition } from './types.ts';

const REFERENCE_ZOOM = 16;
const FOOTPRINT_FILL = 0.94;
const METERS_PER_PIXEL_AT_EQUATOR_Z0 = 78271.51696402048;

function classifyRoof(
  area: number,
  majorMeters: number,
  minorMeters: number,
  rectangularity: number,
  tags: MapFeature['properties'],
): string {
  const aspectRatio = minorMeters > 0 ? majorMeters / minorMeters : 1;
  const buildingType = String(tags.building ?? '').toLowerCase();
  if (rectangularity < 0.72 && area >= 70) return 'compound';
  if (area >= 240 || majorMeters >= 25 || [
    'apartments', 'commercial', 'retail', 'school', 'hospital', 'church', 'cathedral',
  ].includes(buildingType)) return 'manor';
  if (aspectRatio >= 2.05) return 'long';
  if (area <= 55 || majorMeters <= 8) return 'small';
  if (aspectRatio <= 1.25) return 'square';
  return 'cottage';
}

function buildingMetrics(
  coordinates: Position[],
  tags: MapFeature['properties'],
  region: RegionDefinition,
): BuildingMetrics | null {
  const firstCoordinate = coordinates[0];
  const lastCoordinate = coordinates.at(-1);
  const openRing = coordinates.length > 1 && firstCoordinate && lastCoordinate &&
    firstCoordinate[0] === lastCoordinate[0] && firstCoordinate[1] === lastCoordinate[1]
    ? coordinates.slice(0, -1)
    : coordinates;
  const projection = createLocalProjection(region.center);
  const ring = openRing.map(projection.toLocalMeters);
  if (ring.length < 3) return null;

  const { area, centroid } = polygonAreaAndCentroid(ring);
  const average = ring.reduce<Position>((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
  average[0] = average[0] / ring.length;
  average[1] = average[1] / ring.length;

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
  const majorAxis: Position = [Math.cos(angleRadians), Math.sin(angleRadians)];
  const minorAxis: Position = [-majorAxis[1], majorAxis[0]];
  let minMajor = Infinity;
  let maxMajor = -Infinity;
  let minMinor = Infinity;
  let maxMinor = -Infinity;
  for (const point of ring) {
    const major = point[0] * majorAxis[0] + point[1] * majorAxis[1];
    const minor = point[0] * minorAxis[0] + point[1] * minorAxis[1];
    minMajor = Math.min(minMajor, major);
    maxMajor = Math.max(maxMajor, major);
    minMinor = Math.min(minMinor, minor);
    maxMinor = Math.max(maxMinor, minor);
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
  const metersPerPixelZ16 = (METERS_PER_PIXEL_AT_EQUATOR_Z0 *
    Math.cos((region.center[1] * Math.PI) / 180)) / 2 ** REFERENCE_ZOOM;

  return {
    center: projection.fromLocalMeters(centroid),
    centerLocal: centroid,
    majorAxis,
    minorAxis,
    roofStyle: classifyRoof(area, majorMeters, minorMeters, rectangularity, tags),
    rotationDegrees: ((-(normalizedAngle * 180) / Math.PI) % 180 + 180) % 180,
    area,
    majorMeters,
    minorMeters,
    aspectRatio: majorMeters / minorMeters,
    rectangularity,
    iconWidthZ16: (majorMeters / metersPerPixelZ16) * FOOTPRINT_FILL,
    iconHeightZ16: (minorMeters / metersPerPixelZ16) * FOOTPRINT_FILL,
  };
}

export function enrichBuildings(dataset: MapDataset, region: RegionDefinition): MapDataset {
  const generatedKinds = new Set(['building_icon', 'tree_decoration']);
  const retained = dataset.features.filter((feature) => {
    const properties = feature.properties;
    const legacyBuildingIcon = feature.geometry.type === 'Point' &&
      properties.kind === 'building' && properties.fantasy_icon === '⌂';
    return !generatedKinds.has(properties.kind) && !legacyBuildingIcon;
  });
  const buildings: BuildingCandidate[] = [];
  const icons: MapFeature[] = [];

  for (const feature of retained) {
    if (feature.geometry.type !== 'Polygon' || feature.properties.kind !== 'building') continue;
    const metrics = buildingMetrics(feature.geometry.coordinates[0] ?? [], feature.properties, region);
    if (!metrics) continue;
    const sourceId = feature.properties.osm_id!;
    buildings.push({ feature, metrics, sourceId });
    icons.push({
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

  const projection = createLocalProjection(region.center);
  const obstacles = retained.flatMap<Obstacle>((feature) => {
    const normalizedKind = feature.properties.kind === 'waterway' ? 'water' : feature.properties.kind;
    if (!['building', 'road', 'water'].includes(normalizedKind)) return [];
    const geometry = obstacleGeometry(feature, projection.toLocalMeters);
    return geometry ? [{ ...geometry, kind: normalizedKind as Obstacle['kind'] }] : [];
  });
  const trees = createTreeDecorations(buildings, obstacles, projection.fromLocalMeters);

  return {
    ...dataset,
    metadata: {
      ...dataset.metadata,
      building_icons: 'unique procedural roofs sized from both footprint axes at reference zoom 16',
      tree_decorations: `${trees.length} deterministic trees placed near clear residential buildings`,
    },
    features: [...retained, ...icons, ...trees],
  };
}
