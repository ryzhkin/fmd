const DECORATION_RATE = 0.52;
const CANOPY_RADIUS_METERS = 3;
const BUILDING_GAP_METERS = 0.8;
const ROAD_GAP_METERS = 2;
const WATER_GAP_METERS = 1;
const TREE_SPACING_GAP_METERS = 1;
const MAX_TREES_PER_BUILDING = 2;

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pointToSegmentDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point[0] - start[0], point[1] - start[1]);

  const projection = Math.max(0, Math.min(1,
    ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared
  ));
  return Math.hypot(
    point[0] - (start[0] + projection * dx),
    point[1] - (start[1] + projection * dy)
  );
}

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    const crossesLatitude = (currentPoint[1] > point[1]) !== (previousPoint[1] > point[1]);
    if (!crossesLatitude) continue;
    const intersectionX = (previousPoint[0] - currentPoint[0]) *
      (point[1] - currentPoint[1]) /
      (previousPoint[1] - currentPoint[1]) + currentPoint[0];
    if (point[0] < intersectionX) inside = !inside;
  }
  return inside;
}

function pointToPathDistance(point, path, closed = false) {
  if (path.length < 2) return Infinity;
  if (closed && pointInRing(point, path)) return 0;

  let minimum = Infinity;
  const segmentCount = closed ? path.length : path.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    minimum = Math.min(
      minimum,
      pointToSegmentDistance(point, path[index], path[(index + 1) % path.length])
    );
  }
  return minimum;
}

function isDecoratableBuilding(tags, metrics) {
  const buildingType = String(tags.building ?? '').toLowerCase();
  return metrics.area < 240 && ![
    'apartments',
    'commercial',
    'retail',
    'school',
    'hospital',
    'church',
    'cathedral',
    'industrial',
    'warehouse',
  ].includes(buildingType);
}

function candidateTreePoint(metrics, angle, radius, jitter) {
  const direction = [Math.cos(angle), Math.sin(angle)];
  const majorProjection = Math.abs(
    direction[0] * metrics.majorAxis[0] + direction[1] * metrics.majorAxis[1]
  );
  const minorProjection = Math.abs(
    direction[0] * metrics.minorAxis[0] + direction[1] * metrics.minorAxis[1]
  );
  const radialDistance = Math.min(
    majorProjection > 0.001 ? metrics.majorMeters / (2 * majorProjection) : Infinity,
    minorProjection > 0.001 ? metrics.minorMeters / (2 * minorProjection) : Infinity
  );
  const distance = radialDistance + radius + BUILDING_GAP_METERS + jitter;
  return [
    metrics.centerLocal[0] + direction[0] * distance,
    metrics.centerLocal[1] + direction[1] * distance,
  ];
}

function hasClearance(point, radius, obstacles, trees) {
  const clearanceByKind = {
    building: radius + BUILDING_GAP_METERS,
    road: radius + ROAD_GAP_METERS,
    water: radius + WATER_GAP_METERS,
  };

  for (const obstacle of obstacles) {
    if (pointToPathDistance(point, obstacle.path, obstacle.closed) < clearanceByKind[obstacle.kind]) {
      return false;
    }
  }

  return trees.every(tree =>
    Math.hypot(point[0] - tree.point[0], point[1] - tree.point[1]) >=
      radius + tree.radius + TREE_SPACING_GAP_METERS
  );
}

export function obstacleGeometry(feature, toLocalMeters) {
  const coordinates = feature.geometry?.coordinates;
  if (feature.geometry?.type === 'Polygon' && Array.isArray(coordinates?.[0])) {
    return { path: coordinates[0].map(toLocalMeters), closed: true };
  }
  if (feature.geometry?.type === 'LineString' && Array.isArray(coordinates)) {
    return { path: coordinates.map(toLocalMeters), closed: false };
  }
  return null;
}

export function createTreeDecorations(buildings, obstacles, fromLocalMeters) {
  const decorations = [];
  const placedTrees = [];

  for (const building of buildings) {
    const { feature, metrics, sourceId } = building;
    if (!isDecoratableBuilding(feature.properties ?? {}, metrics)) continue;

    const seed = hashString(sourceId);
    if ((seed % 10_000) / 10_000 >= DECORATION_RATE) continue;

    const targetCount = Math.min(
      MAX_TREES_PER_BUILDING,
      1 + Number(((seed >>> 8) & 3) === 0)
    );
    const angleOffset = ((seed >>> 10) % 360) * (Math.PI / 180);

    for (let attempt = 0, placed = 0; attempt < 10 && placed < targetCount; attempt += 1) {
      const variantSeed = hashString(`${sourceId}/${attempt}`);
      const scale = 0.86 + ((variantSeed % 23) / 100);
      const radius = CANOPY_RADIUS_METERS * scale;
      const angle = angleOffset + attempt * (Math.PI * 2 / 10);
      const jitter = ((variantSeed >>> 8) % 16) / 10;
      const point = candidateTreePoint(metrics, angle, radius, jitter);
      if (!hasClearance(point, radius, obstacles, placedTrees)) continue;

      const treeId = `${sourceId}-${placed + 1}`;
      placedTrees.push({ point, radius });
      decorations.push({
        type: 'Feature',
        id: `tree-decoration/${treeId}`,
        properties: {
          osm_id: `tree-decoration-${treeId}`,
          kind: 'tree_decoration',
          decorator_for: sourceId,
          tree_scale: Number(scale.toFixed(2)),
          tree_rotate: variantSeed % 360,
        },
        geometry: { type: 'Point', coordinates: fromLocalMeters(point) },
      });
      placed += 1;
    }
  }

  return decorations;
}
