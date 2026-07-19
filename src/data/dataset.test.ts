import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assertMapDataset } from './dataset';

const validDataset = {
  type: 'FeatureCollection',
  bbox: [0, 0, 1, 1],
  metadata: {
    region_id: 'fixture-v1',
    center: [0, 0],
    plus_code: 'test',
    area: 'test',
    source: 'fixture',
    refreshed_at: '2026-07-19T00:00:00.000Z',
  },
  features: [{
    type: 'Feature',
    id: 'center',
    properties: { kind: 'center', osm_id: 'center' },
    geometry: { type: 'Point', coordinates: [0, 0] },
  }],
};

interface MutableFeature {
  type: string;
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: Record<string, unknown>;
}

interface MutableDataset {
  type: string;
  bbox: number[];
  metadata: Record<string, unknown>;
  features: MutableFeature[];
}

function mutableDataset(): MutableDataset {
  return structuredClone(validDataset);
}

describe('assertMapDataset', () => {
  it('accepts the committed Sumy snapshot', () => {
    const snapshot = JSON.parse(readFileSync(
      new URL('../../public/data/regions/sumy.geojson', import.meta.url),
      'utf8',
    ));
    expect(() => assertMapDataset(snapshot)).not.toThrow();
  });

  it('accepts the application GeoJSON contract', () => {
    expect(() => assertMapDataset(validDataset)).not.toThrow();
  });

  it('rejects unsupported kinds', () => {
    const invalid = mutableDataset();
    invalid.features[0]!.properties.kind = 'unknown';
    expect(() => assertMapDataset(invalid)).toThrow(/unsupported kind/);
  });

  it('rejects duplicate or missing stable feature ids', () => {
    const duplicate = mutableDataset();
    duplicate.features.push(structuredClone(duplicate.features[0]!));
    expect(() => assertMapDataset(duplicate)).toThrow(/Duplicate feature id/);

    const missing = mutableDataset();
    delete missing.features[0]!.id;
    expect(() => assertMapDataset(missing)).toThrow(/stable id/);
  });

  it('rejects invalid bbox, coordinates and geometry types', () => {
    const invalidBbox = mutableDataset();
    invalidBbox.bbox[2] = Number.NaN;
    expect(() => assertMapDataset(invalidBbox)).toThrow(/bbox/);

    const invalidCoordinates = mutableDataset();
    (invalidCoordinates.features[0]!.geometry.coordinates as number[])[0] = Number.POSITIVE_INFINITY;
    expect(() => assertMapDataset(invalidCoordinates)).toThrow(/coordinates/);

    const unsupportedGeometry = mutableDataset();
    unsupportedGeometry.features[0]!.geometry = { type: 'GeometryCollection', coordinates: [0, 0] };
    expect(() => assertMapDataset(unsupportedGeometry)).toThrow(/unsupported geometry/);
  });

  it('requires complete region metadata', () => {
    for (const field of ['region_id', 'refreshed_at', 'center'] as const) {
      const invalid = mutableDataset();
      delete invalid.metadata[field];
      expect(() => assertMapDataset(invalid)).toThrow(/metadata/);
    }
  });

  it('requires the complete building icon contract', () => {
    const buildingIcon = mutableDataset();
    buildingIcon.features[0] = {
      type: 'Feature',
      id: 'building-icon/1',
      properties: {
        kind: 'building_icon', osm_id: 'building-icon-1', source_osm_id: 1,
        roof_style: 'square', building_icon: 'procedural-house-1',
        icon_width_z16: 10, icon_height_z16: 8, icon_rotate: 0,
        building_area_m2: 50, building_major_m: 10, building_minor_m: 8,
        building_aspect: 1.25, building_rectangularity: 0.9,
      },
      geometry: { type: 'Point', coordinates: [0, 0] },
    };
    expect(() => assertMapDataset(buildingIcon)).not.toThrow();
    delete (buildingIcon.features[0]!.properties as Record<string, unknown>).icon_width_z16;
    expect(() => assertMapDataset(buildingIcon)).toThrow(/icon_width_z16/);
  });

  it('requires the complete tree decoration contract', () => {
    const tree = mutableDataset();
    tree.features[0] = {
      type: 'Feature',
      id: 'tree-decoration/1-1',
      properties: {
        kind: 'tree_decoration', osm_id: 'tree-decoration-1-1', decorator_for: 1,
        tree_scale: 0.9, tree_rotate: 42,
      },
      geometry: { type: 'Point', coordinates: [0, 0] },
    };
    expect(() => assertMapDataset(tree)).not.toThrow();
    tree.features[0]!.geometry = { type: 'LineString', coordinates: [[0, 0], [1, 1]] };
    expect(() => assertMapDataset(tree)).toThrow(/Point geometry/);
  });
});
