import type { CanvasImage } from './canvas';

export const SHADOW_CANVAS_SCALE = 1.5;
export const SHADOW_MAX_EDGE = 512;
const SHADOW_BLUR = 0.85;
const SHADOW_COLOR = '#351f0f';

export interface ShadowImage {
  data: ImageData;
  pixelRatio: number;
}

export function createShadowImage(houseImage: CanvasImage, requestedPixelRatio: number): ShadowImage {
  const width = houseImage.logicalWidth * SHADOW_CANVAS_SCALE;
  const height = houseImage.logicalHeight * SHADOW_CANVAS_SCALE;
  const pixelRatio = Math.max(1, Math.min(requestedPixelRatio, SHADOW_MAX_EDGE / Math.max(width, height)));

  const mask = document.createElement('canvas');
  mask.width = houseImage.canvas.width;
  mask.height = houseImage.canvas.height;
  const maskContext = mask.getContext('2d');
  if (!maskContext) throw new Error('Canvas 2D context is unavailable');
  maskContext.drawImage(houseImage.canvas, 0, 0);
  maskContext.globalCompositeOperation = 'source-in';
  maskContext.fillStyle = SHADOW_COLOR;
  maskContext.fillRect(0, 0, mask.width, mask.height);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(height * pixelRatio));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable');
  const drawWidth = houseImage.logicalWidth * pixelRatio;
  const drawHeight = houseImage.logicalHeight * pixelRatio;
  context.shadowColor = SHADOW_COLOR;
  context.shadowBlur = SHADOW_BLUR * pixelRatio;
  context.drawImage(mask, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
  return { data: context.getImageData(0, 0, canvas.width, canvas.height), pixelRatio };
}
