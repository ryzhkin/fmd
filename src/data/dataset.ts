import type { Geometry } from 'geojson';
import type {
  BuildingIconProperties,
  MapDataset,
  RegionDefinition,
  TreeDecorationProperties,
  WorldKind,
  WorldProperties,
} from './types';

const WORLD_KINDS = new Set<WorldKind>([
  'building', 'building_icon', 'center', 'commercial', 'forest', 'green', 'industrial',
  'other', 'poi', 'residential', 'road', 'tree_decoration', 'water', 'waterway',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStableId(value: unknown): value is string | number {
  return isNonEmptyString(value) || (typeof value === 'number' && Number.isFinite(value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPosition(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every(isFiniteNumber);
}

function assertGeometry(value: unknown, featureId: string | number): asserts value is Geometry {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new Error(`Feature ${String(featureId)} has invalid geometry`);
  }
  if (value.type === 'Point') {
    if (!isPosition(value.coordinates)) throw new Error(`Feature ${String(featureId)} has invalid coordinates`);
    return;
  }
  if (value.type === 'LineString') {
    if (!Array.isArray(value.coordinates) || value.coordinates.length < 2 || !value.coordinates.every(isPosition)) {
      throw new Error(`Feature ${String(featureId)} has invalid coordinates`);
    }
    return;
  }
  if (value.type === 'Polygon') {
    const valid = Array.isArray(value.coordinates) && value.coordinates.length > 0 &&
      value.coordinates.every((ring) => Array.isArray(ring) && ring.length >= 4 && ring.every(isPosition));
    if (!valid) throw new Error(`Feature ${String(featureId)} has invalid coordinates`);
    return;
  }
  throw new Error(`Feature ${String(featureId)} has unsupported geometry ${value.type}`);
}

function assertRequiredNumbers(
  properties: Record<string, unknown>,
  fields: string[],
  featureId: string | number,
): void {
  for (const field of fields) {
    if (!isFiniteNumber(properties[field])) {
      throw new Error(`Feature ${String(featureId)} requires finite ${field}`);
    }
  }
}

function assertGeneratedProperties(
  properties: Record<string, unknown>,
  geometry: Geometry,
  featureId: string | number,
): asserts properties is BuildingIconProperties | TreeDecorationProperties {
  if (geometry.type !== 'Point') {
    throw new Error(`Generated feature ${String(featureId)} must use Point geometry`);
  }
  if (!isStableId(properties.osm_id)) {
    throw new Error(`Generated feature ${String(featureId)} requires osm_id`);
  }
  if (properties.kind === 'building_icon') {
    if (!isStableId(properties.source_osm_id) || !isNonEmptyString(properties.roof_style) ||
      !isNonEmptyString(properties.building_icon)) {
      throw new Error(`Building icon ${String(featureId)} has incomplete identity fields`);
    }
    assertRequiredNumbers(properties, [
      'icon_width_z16', 'icon_height_z16', 'icon_rotate', 'building_area_m2',
      'building_major_m', 'building_minor_m', 'building_aspect', 'building_rectangularity',
    ], featureId);
    if ((properties.icon_width_z16 as number) <= 0 || (properties.icon_height_z16 as number) <= 0) {
      throw new Error(`Building icon ${String(featureId)} dimensions must be positive`);
    }
    return;
  }
  if (!isStableId(properties.decorator_for)) {
    throw new Error(`Tree decoration ${String(featureId)} requires decorator_for`);
  }
  assertRequiredNumbers(properties, ['tree_scale', 'tree_rotate'], featureId);
  if ((properties.tree_scale as number) <= 0) {
    throw new Error(`Tree decoration ${String(featureId)} scale must be positive`);
  }
}

function assertWorldProperties(
  value: unknown,
  geometry: Geometry,
  featureId: string | number,
): asserts value is WorldProperties {
  if (!isRecord(value) || !WORLD_KINDS.has(value.kind as WorldKind)) {
    throw new Error(`Feature ${String(featureId)} has unsupported kind`);
  }
  if (value.kind === 'building_icon' || value.kind === 'tree_decoration') {
    assertGeneratedProperties(value, geometry, featureId);
  }
}

function assertMetadata(value: unknown): asserts value is MapDataset['metadata'] {
  if (!isRecord(value) || !isNonEmptyString(value.region_id) || !isPosition(value.center) ||
    !isNonEmptyString(value.refreshed_at) || !Number.isFinite(Date.parse(value.refreshed_at)) ||
    !isNonEmptyString(value.plus_code) || !isNonEmptyString(value.area) || !isNonEmptyString(value.source)) {
    throw new Error('Dataset metadata is invalid');
  }
}

export function assertMapDataset(value: unknown): asserts value is MapDataset {
  if (!value || typeof value !== 'object') throw new Error('Dataset must be an object');
  const dataset = value as Partial<MapDataset>;
  if (dataset.type !== 'FeatureCollection' || !Array.isArray(dataset.features)) {
    throw new Error('Dataset must be a GeoJSON FeatureCollection');
  }
  if (!Array.isArray(dataset.bbox) || dataset.bbox.length !== 4 || !dataset.bbox.every(isFiniteNumber)) {
    throw new Error('Dataset bbox must contain four finite numbers');
  }
  assertMetadata(dataset.metadata);
  const featureIds = new Set<string | number>();
  for (const feature of dataset.features) {
    if (!isRecord(feature) || feature.type !== 'Feature' || !isStableId(feature.id)) {
      throw new Error('Dataset contains a feature without a stable id');
    }
    if (featureIds.has(feature.id)) throw new Error(`Duplicate feature id ${String(feature.id)}`);
    featureIds.add(feature.id);
    assertGeometry(feature.geometry, feature.id);
    assertWorldProperties(feature.properties, feature.geometry, feature.id);
  }
}

export interface DatasetProvider {
  load(region: RegionDefinition, signal?: AbortSignal): Promise<MapDataset>;
}

export class StaticDatasetProvider implements DatasetProvider {
  async load(region: RegionDefinition, signal?: AbortSignal): Promise<MapDataset> {
    const response = await fetch(region.datasetUrl, { cache: 'no-store', signal });
    if (!response.ok) throw new Error(`GeoJSON request failed: ${response.status}`);
    const dataset: unknown = await response.json();
    assertMapDataset(dataset);
    return dataset;
  }
}
