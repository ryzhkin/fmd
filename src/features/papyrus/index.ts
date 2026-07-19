import type { Map as MapLibreMap } from 'maplibre-gl';
import { loadOptionalImage } from '../../assets/images';
import type { FeatureInstaller } from '../../map/feature';
import { LAYER_IDS } from '../../map/layer-ids';

const IMAGE_ID = 'papyrus-texture';
const TEXTURE_URL = `${import.meta.env.BASE_URL}assets/papyrus-texture.svg`;
const TILE_SIZE = 512;

function createSoftenedTexture(image: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D context is unavailable');
  context.fillStyle = '#e8dcc1';
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  context.globalAlpha = 0.76;
  context.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);
  context.globalAlpha = 1;
  context.fillStyle = 'rgba(250, 244, 231, 0.12)';
  context.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  return context.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
}

export async function installPapyrus(map: MapLibreMap): Promise<void> {
  if (!map.getLayer(LAYER_IDS.paper)) return;
  const image = await loadOptionalImage(TEXTURE_URL, 'Papyrus texture image failed to load');
  if (!image) return;
  if (!map.hasImage(IMAGE_ID)) map.addImage(IMAGE_ID, createSoftenedTexture(image), { pixelRatio: 1 });
  map.setPaintProperty(LAYER_IDS.paper, 'background-color', '#e3d4b5');
  map.setPaintProperty(LAYER_IDS.paper, 'background-pattern', IMAGE_ID);
}

export const installPapyrusFeature: FeatureInstaller = ({ map }) => installPapyrus(map);
