import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type BaseWorldKind =
  | 'building'
  | 'center'
  | 'commercial'
  | 'forest'
  | 'green'
  | 'industrial'
  | 'other'
  | 'poi'
  | 'residential'
  | 'road'
  | 'water'
  | 'waterway';

export type GeneratedWorldKind = 'building_icon' | 'tree_decoration';
export type WorldKind = BaseWorldKind | GeneratedWorldKind;

interface CommonWorldProperties {
  osm_id?: string | number;
  label?: string;
  fantasy_icon?: string;
  building?: string;
  highway?: string;
  [key: string]: unknown;
}

export interface BaseWorldProperties extends CommonWorldProperties {
  kind: BaseWorldKind;
}

export interface BuildingIconProperties extends CommonWorldProperties {
  kind: 'building_icon';
  osm_id: string | number;
  source_osm_id: string | number;
  roof_style: string;
  building_icon: string;
  building_shadow_icon?: string;
  icon_width_z16: number;
  icon_height_z16: number;
  icon_rotate: number;
  building_area_m2: number;
  building_major_m: number;
  building_minor_m: number;
  building_aspect: number;
  building_rectangularity: number;
}

export interface TreeDecorationProperties extends CommonWorldProperties {
  kind: 'tree_decoration';
  osm_id: string | number;
  decorator_for: string | number;
  tree_scale: number;
  tree_rotate: number;
}

export type WorldProperties =
  | BaseWorldProperties
  | BuildingIconProperties
  | TreeDecorationProperties;

export interface DatasetMetadata {
  region_id: string;
  center: [number, number];
  plus_code: string;
  area: string;
  source: string;
  refreshed_at: string;
  building_icons?: string;
  tree_decorations?: string;
}

export interface MapDataset extends FeatureCollection<Geometry, WorldProperties> {
  name?: string;
  bbox: [number, number, number, number];
  metadata: DatasetMetadata;
  features: Array<Feature<Geometry, WorldProperties>>;
}

export interface RegionDefinition {
  id: string;
  title: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  maxBounds: [[number, number], [number, number]];
  initialZoom: number;
  datasetUrl: string;
}
