import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapDataset } from '../data/types';

export interface MapFeatureContext {
  map: MapLibreMap;
  dataset: MapDataset;
}

export type FeatureCleanup = () => void;
export type FeatureInstaller = (context: MapFeatureContext) => void | FeatureCleanup | Promise<void | FeatureCleanup>;

export async function installFeatures(
  context: MapFeatureContext,
  installers: readonly FeatureInstaller[],
): Promise<FeatureCleanup[]> {
  const cleanups: FeatureCleanup[] = [];
  for (const install of installers) {
    const cleanup = await install(context);
    if (cleanup) cleanups.push(cleanup);
  }
  return cleanups;
}
