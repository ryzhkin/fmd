import type { Map as MapLibreMap } from 'maplibre-gl';
import type { RegionDefinition } from '../data/types';
import { installE2EBridge } from './e2e-bridge';

interface E2EMapReadyDetail {
  map: MapLibreMap;
  region: RegionDefinition;
}

window.addEventListener('fmd:e2e-map-ready', event => {
  const { map, region } = (event as CustomEvent<E2EMapReadyDetail>).detail;
  installE2EBridge(map, region);
}, { once: true });
