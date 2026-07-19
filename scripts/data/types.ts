export type Position = [number, number];

export type Geometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'LineString'; coordinates: Position[] }
  | { type: 'Polygon'; coordinates: Position[][] };

export interface MapProperties {
  kind: string;
  osm_id?: string | number;
  [key: string]: unknown;
}

export interface MapFeature {
  type: 'Feature';
  id: string;
  properties: MapProperties;
  geometry: Geometry;
}

export interface MapDataset {
  type: 'FeatureCollection';
  name: string;
  bbox: [number, number, number, number];
  metadata: {
    region_id: string;
    center: Position;
    refreshed_at: string;
    source: string;
    [key: string]: unknown;
  };
  features: MapFeature[];
}

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface RegionDefinition {
  id: string;
  name: string;
  center: Position;
  bbox: BoundingBox;
  plusCode: string;
  areaLabel: string;
  outputPath: string;
}

export interface OsmElement {
  type: 'node' | 'way' | string;
  id: number;
  lon?: number;
  lat?: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lon: number; lat: number }>;
}

export interface OsmResponse {
  elements: OsmElement[];
}
