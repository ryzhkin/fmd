import type { ExpressionSpecification, LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { MapDataset } from '../data/types';
import { LAYER_IDS, ROAD_SOURCE_ID, WORLD_SOURCE_ID } from './layer-ids';
import { createRoadDisplayDataset } from './road-geometry';
import { ROAD_LAYERS } from './road-layers';

const waterShadowWidth: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 13, 2.6, 16, 4.5, 19, 9];
const waterWidth: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 13, 0.6, 16, 2.5, 19, 7];

const layers: LayerSpecification[] = [
  {
    id: LAYER_IDS.residential, type: 'fill', source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'residential'],
    paint: { 'fill-color': '#cdb47c', 'fill-opacity': 0.25, 'fill-outline-color': '#9e8352' },
  },
  {
    id: LAYER_IDS.green, type: 'fill', source: WORLD_SOURCE_ID,
    filter: ['in', ['get', 'kind'], ['literal', ['forest', 'green']]],
    paint: {
      'fill-color': ['match', ['get', 'kind'], 'forest', '#315438', '#71834b'],
      'fill-opacity': ['match', ['get', 'kind'], 'forest', 0.72, 0.42],
      'fill-outline-color': '#28452d',
    },
  },
  {
    id: LAYER_IDS.waterPolygons, type: 'fill', source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'water'],
    paint: { 'fill-color': '#79aab2', 'fill-opacity': 0.82, 'fill-outline-color': '#315e67' },
  },
  {
    id: LAYER_IDS.waterShadow, type: 'line', source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'waterway'],
    paint: { 'line-color': '#315e67', 'line-width': waterShadowWidth, 'line-opacity': 0.55 },
  },
  {
    id: LAYER_IDS.waterLines, type: 'line', source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'waterway'],
    paint: { 'line-color': '#88bbc3', 'line-width': waterWidth },
  },
  ...ROAD_LAYERS,
  {
    id: LAYER_IDS.buildingFootprintShadow, type: 'fill', source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'building'],
    paint: { 'fill-color': '#5b3a23', 'fill-translate': [1.5, 1.5], 'fill-opacity': 0.65 },
  },
  {
    id: LAYER_IDS.buildingFootprints, type: 'fill', source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'building'],
    paint: {
      'fill-color': ['match', ['get', 'building'], ['commercial', 'retail'], '#b36b43', ['church', 'cathedral', 'chapel'], '#a66c42', '#c08b4b'],
      'fill-outline-color': '#5b3a23',
      'fill-opacity': 0.92,
    },
  },
  {
    id: LAYER_IDS.fantasyIcons, type: 'symbol', source: WORLD_SOURCE_ID,
    filter: ['all', ['has', 'fantasy_icon'], ['!=', ['get', 'fantasy_icon'], '']],
    minzoom: 15.2,
    layout: {
      'text-field': ['get', 'fantasy_icon'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 15, 12, 18, 20],
      'text-font': ['Noto Sans Regular'],
      'text-allow-overlap': false,
    },
    paint: { 'text-color': '#2f2519', 'text-halo-color': '#ead9ad', 'text-halo-width': 1.2 },
  },
  {
    id: LAYER_IDS.labels, type: 'symbol', source: WORLD_SOURCE_ID,
    filter: ['all', ['has', 'label'], ['!=', ['get', 'label'], '']],
    minzoom: 15,
    layout: {
      'symbol-placement': 'point',
      'text-field': ['get', 'label'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 15, 10, 18, 14],
      'text-font': ['Noto Sans Regular'],
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
      'text-max-width': 12,
    },
    paint: { 'text-color': '#382719', 'text-halo-color': '#ead9ad', 'text-halo-width': 1.5 },
  },
  {
    id: LAYER_IDS.center, type: 'circle', source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'center'],
    paint: { 'circle-radius': 9, 'circle-color': '#f0d47c', 'circle-stroke-color': '#3f2a18', 'circle-stroke-width': 3 },
  },
];

export function installBaseLayers(map: MapLibreMap, dataset: MapDataset): void {
  map.addSource(WORLD_SOURCE_ID, { type: 'geojson', data: dataset, promoteId: 'osm_id' });
  map.addSource(ROAD_SOURCE_ID, {
    type: 'geojson',
    data: createRoadDisplayDataset(dataset),
    promoteId: 'osm_id',
  });
  for (const layer of layers) map.addLayer(layer);
}
