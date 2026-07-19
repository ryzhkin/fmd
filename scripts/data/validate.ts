import type { MapDataset, MapFeature, Position } from './types.ts';

function assertPosition(position: unknown, label: string): asserts position is Position {
  if (!Array.isArray(position) || position.length !== 2 ||
    !position.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))) {
    throw new Error(`${label} must be a finite [longitude, latitude] position`);
  }
}

function validateFeature(feature: MapFeature, index: number): void {
  if (!feature.id) throw new Error(`Feature at index ${index} has no stable id`);
  if (!feature.properties?.kind) throw new Error(`Feature ${feature.id} has no kind`);
  const { geometry } = feature;
  if (geometry.type === 'Point') assertPosition(geometry.coordinates, `Feature ${feature.id}`);
  else if (geometry.type === 'LineString') geometry.coordinates.forEach((point) => assertPosition(point, `Feature ${feature.id}`));
  else if (geometry.type === 'Polygon') geometry.coordinates.flat().forEach((point) => assertPosition(point, `Feature ${feature.id}`));
  else throw new Error(`Feature ${feature.id} has unsupported geometry`);
}

export function validateDataset(dataset: MapDataset): void {
  if (dataset.type !== 'FeatureCollection') throw new Error('Dataset must be a FeatureCollection');
  if (!dataset.metadata.region_id) throw new Error('Dataset metadata.region_id is required');
  if (!Number.isFinite(Date.parse(dataset.metadata.refreshed_at))) {
    throw new Error('Dataset metadata.refreshed_at must be an ISO date');
  }
  const ids = new Set<string>();
  dataset.features.forEach((feature, index) => {
    validateFeature(feature, index);
    if (ids.has(feature.id)) throw new Error(`Duplicate feature id: ${feature.id}`);
    ids.add(feature.id);
  });
}
