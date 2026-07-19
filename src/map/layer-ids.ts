import type { LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';

export const LAYER_IDS = Object.freeze({
  paper: 'paper',
  reality: 'osm-reality',
  residential: 'landuse-residential',
  green: 'green-land',
  waterPolygons: 'water-polygons',
  waterShadow: 'water-lines-shadow',
  waterLines: 'water-lines',
  roadSketch: 'road-sketch',
  roadCasing: 'road-casing',
  roads: 'roads',
  trails: 'road-trails',
  buildingFootprintShadow: 'buildings-shadow',
  buildingFootprints: 'buildings',
  treeShadows: 'tree-decoration-shadows',
  trees: 'tree-decorations',
  buildingIconShadows: 'building-icon-shadows',
  buildingIcons: 'building-icons',
  fantasyIcons: 'fantasy-icons',
  labels: 'labels',
  center: 'center-ring',
});

export const WORLD_SOURCE_ID = 'world';
export const ROAD_SOURCE_ID = 'fantasy-roads';
export function addLayerBeforeFantasyIcons(map: MapLibreMap, layer: LayerSpecification): void {
  const anchor = map.getLayer(LAYER_IDS.fantasyIcons) ? LAYER_IDS.fantasyIcons : undefined;
  map.addLayer(layer, anchor);
}

export const FOOTPRINT_LAYER_IDS = [
  LAYER_IDS.buildingFootprintShadow,
  LAYER_IDS.buildingFootprints,
] as const;
