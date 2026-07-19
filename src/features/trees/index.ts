import type { Map as MapLibreMap } from 'maplibre-gl';
import { loadOptionalImage } from '../../assets/images';
import { createCanvasImage, drawTopDownAsset } from '../../rendering/canvas';
import { createShadowImage, SHADOW_CANVAS_SCALE, SHADOW_MAX_EDGE } from '../../rendering/shadow';
import type { FeatureInstaller } from '../../map/feature';
import { addLayerBeforeFantasyIcons, LAYER_IDS, WORLD_SOURCE_ID } from '../../map/layer-ids';
import { METERS_PER_PIXEL_Z16, shadowPaint, symbolLayout } from '../../map/symbols';

const TREE_CANOPY_METERS = 6;
const TREE_LOGICAL_SIZE = TREE_CANOPY_METERS / METERS_PER_PIXEL_Z16;
const TREE_IMAGE_NAME = 'decorative-tree-deciduous';
const TREE_SHADOW_IMAGE_NAME = 'decorative-tree-deciduous-shadow';
const TREE_URL = `${import.meta.env.BASE_URL}assets/tree-deciduous-topdown.webp`;
const MAX_ICON_EDGE = 1024;

export async function loadTreeAsset(): Promise<HTMLImageElement | null> {
  return loadOptionalImage(TREE_URL, 'Decorative tree asset is unavailable');
}

export function prepareTreeImages(map: MapLibreMap, image: HTMLImageElement | null): boolean {
  if (!image) return false;
  const treeImage = createCanvasImage(
    TREE_LOGICAL_SIZE,
    TREE_LOGICAL_SIZE,
    MAX_ICON_EDGE / TREE_LOGICAL_SIZE,
    (context, width, height) => drawTopDownAsset(context, image, width, height),
  );
  if (!map.hasImage(TREE_IMAGE_NAME)) map.addImage(TREE_IMAGE_NAME, treeImage.data, { pixelRatio: treeImage.pixelRatio });
  if (!map.hasImage(TREE_SHADOW_IMAGE_NAME)) {
    const ratio = SHADOW_MAX_EDGE / (TREE_LOGICAL_SIZE * SHADOW_CANVAS_SCALE);
    const shadow = createShadowImage(treeImage, ratio);
    map.addImage(TREE_SHADOW_IMAGE_NAME, shadow.data, { pixelRatio: shadow.pixelRatio });
  }
  return true;
}

export function installTreeLayers(map: MapLibreMap): void {
  addLayerBeforeFantasyIcons(map, {
    id: LAYER_IDS.treeShadows,
    type: 'symbol',
    source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'tree_decoration'],
    minzoom: 14.5,
    layout: symbolLayout(TREE_SHADOW_IMAGE_NAME, 'tree_rotate', 'tree_scale'),
    paint: shadowPaint(0.26),
  });
  addLayerBeforeFantasyIcons(map, {
    id: LAYER_IDS.trees,
    type: 'symbol',
    source: WORLD_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'tree_decoration'],
    minzoom: 14.5,
    layout: symbolLayout(TREE_IMAGE_NAME, 'tree_rotate', 'tree_scale'),
    paint: { 'icon-opacity': 0.99 },
  });
}

export function createTreeInstaller(image: HTMLImageElement | null): FeatureInstaller {
  return ({ map }) => {
    if (prepareTreeImages(map, image)) installTreeLayers(map);
  };
}
