import type { Map as MapLibreMap } from 'maplibre-gl';
import { SUMY_REGION } from './config/region';
import { StaticDatasetProvider } from './data/dataset';
import { createMap, waitForMapLoad } from './map/create-map';
import { installBaseLayers } from './map/base-layers';
import { installFeatures, type FeatureCleanup } from './map/feature';
import { createBuildingInstaller, describeBuildingAssets, loadBuildingAssets, prepareBuildings } from './features/buildings';
import { installPapyrusFeature } from './features/papyrus';
import { createTreeInstaller, loadTreeAsset } from './features/trees';
import { MapViewController } from './ui/map-view-controller';
import { StatusView } from './ui/status';

export interface FantasyMapApp {
  map: MapLibreMap;
  destroy(): void;
}

function waitForFirstIdle(map: MapLibreMap): Promise<void> {
  if (!map.isMoving() && map.loaded()) return Promise.resolve();
  return new Promise(resolve => map.once('idle', () => resolve()));
}

export async function bootstrap(): Promise<FantasyMapApp> {
  const status = new StatusView();
  const provider = new StaticDatasetProvider();
  const controller = new AbortController();
  const map = createMap(SUMY_REGION);
  const cleanups: FeatureCleanup[] = [];

  map.on('error', event => console.error(event.error ?? event));
  try {
    const [dataset, buildingAssets, treeAsset] = await Promise.all([
      provider.load(SUMY_REGION, controller.signal),
      loadBuildingAssets(),
      loadTreeAsset(),
      waitForMapLoad(map),
    ]);

    prepareBuildings(map, dataset, buildingAssets);
    installBaseLayers(map, dataset);
    const treesReady = Boolean(treeAsset);
    cleanups.push(...await installFeatures({ map, dataset }, [
      installPapyrusFeature,
      createTreeInstaller(treeAsset),
      createBuildingInstaller(),
    ]));

    for (const style of ['square', 'cottage', 'long'] as const) {
      document.body.dataset[`${style}RoofAsset`] = buildingAssets[style] ? 'loaded' : 'fallback';
    }
    document.body.dataset.treeAsset = treesReady ? 'loaded' : 'unavailable';
    const description = document.querySelector<HTMLElement>('[data-legend-description]');
    if (description) description.textContent = describeBuildingAssets(buildingAssets, treesReady);

    cleanups.push(new MapViewController(map).install());
    if (import.meta.env.MODE === 'e2e') {
      window.dispatchEvent(new CustomEvent('fmd:e2e-map-ready', { detail: { map, region: SUMY_REGION } }));
    }
    map.fitBounds(SUMY_REGION.bounds, { padding: 56, duration: 0 });
    await waitForFirstIdle(map);
    document.body.dataset.appReady = 'true';
    status.ready();
  } catch (error) {
    status.error(error);
    throw error;
  }

  return {
    map,
    destroy(): void {
      controller.abort();
      cleanups.reverse().forEach(cleanup => cleanup());
      map.remove();
    },
  };
}
