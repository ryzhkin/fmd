import type { Map as MapLibreMap } from 'maplibre-gl';
import type { RegionDefinition } from '../data/types';
import { LAYER_IDS, WORLD_SOURCE_ID } from '../map/layer-ids';

export type E2EZoom = 15.2 | 18.3 | 19;
export interface E2EDiagnostics {
  layerOrder: string[];
  buildingShadowAnchor: unknown;
  treeShadowAnchor: unknown;
  papyrusReady: boolean;
  buildingIcons: number;
  treeDecorations: number;
}
export interface FmdE2EBridge {
  jumpTo(zoom: E2EZoom, center?: RegionDefinition['center']): Promise<void>;
  diagnostics(): E2EDiagnostics;
}
declare global {
  interface Window { __FMD_E2E__?: FmdE2EBridge }
}

const ORDERED_VISUAL_LAYERS = [
  LAYER_IDS.treeShadows,
  LAYER_IDS.trees,
  LAYER_IDS.buildingIconShadows,
  LAYER_IDS.buildingIcons,
  LAYER_IDS.fantasyIcons,
] as const;

function renderedFeatureCount(map: MapLibreMap, kind: string): number {
  return map.querySourceFeatures(WORLD_SOURCE_ID, {
    filter: ['==', ['get', 'kind'], kind],
  }).length;
}

function waitForIdleAfterJump(map: MapLibreMap, center: RegionDefinition['center'], zoom: E2EZoom): Promise<void> {
  return new Promise(resolve => {
    map.once('idle', () => resolve());
    map.jumpTo({ center, zoom });
  });
}

export function installE2EBridge(map: MapLibreMap, region: RegionDefinition): () => void {
  const bridge: FmdE2EBridge = {
    jumpTo: (zoom, center = region.center) => waitForIdleAfterJump(map, center, zoom),
    diagnostics: () => ({
      layerOrder: ORDERED_VISUAL_LAYERS.map(id => {
        const index = map.getStyle().layers.findIndex(layer => layer.id === id);
        return `${index}:${id}`;
      }),
      buildingShadowAnchor: map.getPaintProperty(LAYER_IDS.buildingIconShadows, 'icon-translate-anchor'),
      treeShadowAnchor: map.getPaintProperty(LAYER_IDS.treeShadows, 'icon-translate-anchor'),
      papyrusReady: map.hasImage('papyrus-texture') &&
        map.getPaintProperty(LAYER_IDS.paper, 'background-pattern') === 'papyrus-texture',
      buildingIcons: renderedFeatureCount(map, 'building_icon'),
      treeDecorations: renderedFeatureCount(map, 'tree_decoration'),
    }),
  };
  window.__FMD_E2E__ = bridge;
  return () => {
    if (window.__FMD_E2E__ === bridge) delete window.__FMD_E2E__;
  };
}
