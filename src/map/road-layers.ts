import type { ExpressionSpecification, FilterSpecification, LayerSpecification } from 'maplibre-gl';
import { LAYER_IDS, ROAD_SOURCE_ID } from './layer-ids';

const TRAIL_TYPES = ['track', 'path', 'footway'];
const ARTERIAL_TYPES = ['secondary', 'tertiary'];
const LOCAL_TYPES = ['residential', 'living_street', 'unclassified'];

const vehicleRoadFilter: FilterSpecification = [
  'all',
  ['==', ['get', 'kind'], 'road'],
  ['match', ['get', 'highway'], TRAIL_TYPES, false, true],
];
const trailFilter: FilterSpecification = [
  'all',
  ['==', ['get', 'kind'], 'road'],
  ['match', ['get', 'highway'], TRAIL_TYPES, true, false],
];

type RoadWidths = [arterial: number, local: number, minor: number];

function roadWidth(stops: Array<[zoom: number, widths: RoadWidths]>): ExpressionSpecification {
  return [
    'interpolate', ['linear'], ['zoom'],
    ...stops.flatMap(([zoom, [arterial, local, minor]]) => [
      zoom,
      ['match', ['get', 'highway'], ARTERIAL_TYPES, arterial, LOCAL_TYPES, local, minor],
    ]),
  ] as ExpressionSpecification;
}

function fadeInService(visibleOpacity: number): ExpressionSpecification {
  return [
    'interpolate', ['linear'], ['zoom'],
    15.5, ['match', ['get', 'highway'], 'service', 0, visibleOpacity],
    16.5, visibleOpacity,
  ];
}

const roadSketchWidth = roadWidth([
  [13, [4, 2.7, 1.8]],
  [16, [8.5, 5.6, 3.4]],
  [19, [16.5, 12, 7.5]],
]);
const roadCasingWidth = roadWidth([
  [13, [3, 1.9, 1.2]],
  [16, [7, 4.5, 2.5]],
  [19, [15, 9.5, 5]],
]);
const vehicleRoadWidth = roadWidth([
  [13, [1.1, 0.4, 0.15]],
  [16, [4.6, 2.3, 1.1]],
  [19, [12, 6.5, 3.2]],
]);
const trailWidth: ExpressionSpecification = [
  'interpolate', ['linear'], ['zoom'],
  14.5, ['match', ['get', 'highway'], 'track', 0.7, 'path', 0.45, 0.35],
  16, ['match', ['get', 'highway'], 'track', 1.5, 'path', 1.1, 0.8],
  19, ['match', ['get', 'highway'], 'track', 3.5, 'path', 2.6, 2.2],
];

const vehicleRoadColor: ExpressionSpecification = [
  'case',
  ['match', ['get', 'surface'], ['gravel', 'fine_gravel', 'pebblestone'], true, false], '#a68150',
  ['match', ['get', 'surface'], ['dirt', 'ground', 'earth', 'grass'], true, false], '#896440',
  ['match', ['get', 'highway'], ARTERIAL_TYPES, '#dfbf76', LOCAL_TYPES, '#b68a50', '#876b46'],
];
const trailColor: ExpressionSpecification = [
  'case',
  ['==', ['get', 'surface'], 'grass'], '#6d653f',
  ['match', ['get', 'surface'], ['dirt', 'ground', 'earth'], true, false], '#755035',
  ['match', ['get', 'highway'], 'track', '#80603d', 'path', '#6b4b36', '#5b4637'],
];

export const ROAD_LAYERS: LayerSpecification[] = [
  {
    id: LAYER_IDS.roadSketch,
    type: 'line',
    source: ROAD_SOURCE_ID,
    filter: vehicleRoadFilter,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#3b291d',
      'line-width': roadSketchWidth,
      'line-offset': ['interpolate', ['linear'], ['zoom'], 13, 0.25, 16, 0.65, 19, 1.1],
      'line-blur': 0.45,
      'line-opacity': fadeInService(0.2),
    },
  },
  {
    id: LAYER_IDS.roadCasing,
    type: 'line',
    source: ROAD_SOURCE_ID,
    filter: vehicleRoadFilter,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#49311e',
      'line-width': roadCasingWidth,
      'line-opacity': fadeInService(0.72),
    },
  },
  {
    id: LAYER_IDS.roads,
    type: 'line',
    source: ROAD_SOURCE_ID,
    filter: vehicleRoadFilter,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': vehicleRoadColor,
      'line-width': vehicleRoadWidth,
      'line-opacity': fadeInService(0.96),
    },
  },
  {
    id: LAYER_IDS.trails,
    type: 'line',
    source: ROAD_SOURCE_ID,
    filter: trailFilter,
    minzoom: 14.5,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': trailColor,
      'line-width': trailWidth,
      'line-dasharray': [2.4, 1.8],
      'line-opacity': ['match', ['get', 'highway'], 'track', 0.76, 'path', 0.65, 0.55],
    },
  },
];
