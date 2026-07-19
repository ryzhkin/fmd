import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapDataset } from '../../data/types';
import type { FeatureInstaller } from '../../map/feature';
import { addLayerBeforeFantasyIcons, LAYER_IDS, WORLD_SOURCE_ID } from '../../map/layer-ids';
import { shadowPaint, symbolLayout } from '../../map/symbols';
import { DETAILED_ROOFS, loadDetailedRoofImages, type DetailedRoofImages } from './roof-assets';
import { prepareBuildingIcons } from './roof-atlas';

export { logicalDimensions, roofStyle } from './roof-model';

export async function loadBuildingAssets(): Promise<DetailedRoofImages> {
  return loadDetailedRoofImages();
}


export function prepareBuildings(map: MapLibreMap, dataset: MapDataset, images: DetailedRoofImages): void {
  prepareBuildingIcons(map, dataset, images);
}

export function installBuildingLayers(map: MapLibreMap): void {
  addLayerBeforeFantasyIcons(map, {
    id: LAYER_IDS.buildingIconShadows,
    type: 'symbol',
    source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'building_icon'],
    minzoom: 14.5,
    layout: symbolLayout(['get', 'building_shadow_icon'], 'icon_rotate'),
    paint: shadowPaint(0.3),
  });
  addLayerBeforeFantasyIcons(map, {
    id: LAYER_IDS.buildingIcons,
    type: 'symbol',
    source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'building_icon'],
    minzoom: 14.5,
    layout: symbolLayout(['get', 'building_icon'], 'icon_rotate'),
    paint: { 'icon-opacity': 0.99 },
  });
  if (map.getLayer(LAYER_IDS.buildingFootprints)) {
    map.setPaintProperty(LAYER_IDS.buildingFootprints, 'fill-opacity', 0.45);
  }
}

export function createBuildingInstaller(): FeatureInstaller {
  return ({ map }) => installBuildingLayers(map);
}

export function describeBuildingAssets(images: DetailedRoofImages, treesReady: boolean): string {
  const labels = (Object.keys(images) as Array<keyof typeof DETAILED_ROOFS>).map(style => DETAILED_ROOFS[style].label);
  if (!labels.length) return 'Каждая крыша процедурно строится по реальным длине, ширине и повороту контура OSM.';
  const trees = treesReady ? ' Лиственные деревья добавляются только там, где рядом нет зданий, дорог и воды.' : '';
  return `Размер, положение и поворот домов берутся из OSM. Для ${labels.join(' и ')} зданий используются детализированные фэнтезийные крыши.${trees}`;
}
