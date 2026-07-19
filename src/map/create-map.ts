import maplibregl, { type Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl';
import type { RegionDefinition } from '../data/types';
import { LAYER_IDS } from './layer-ids';

const style: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    { id: LAYER_IDS.paper, type: 'background', paint: { 'background-color': '#dcc38e' } },
    {
      id: LAYER_IDS.reality,
      type: 'raster',
      source: 'osm',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 1 },
    },
  ],
};

export function createMap(region: RegionDefinition): MapLibreMap {
  const map = new maplibregl.Map({
    container: 'map',
    center: region.center,
    zoom: region.initialZoom,
    minZoom: 13,
    maxZoom: 19,
    maxBounds: region.maxBounds,
    attributionControl: false,
    style,
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
  map.addControl(new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    fitBoundsOptions: { maxZoom: 17 },
  }), 'bottom-right');
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  return map;
}

export function waitForMapLoad(map: MapLibreMap): Promise<void> {
  if (map.loaded()) return Promise.resolve();
  return new Promise((resolve) => map.once('load', () => resolve()));
}
