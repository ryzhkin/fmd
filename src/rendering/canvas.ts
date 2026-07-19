export interface CanvasImage {
  canvas: HTMLCanvasElement;
  data: ImageData;
  pixelRatio: number;
  logicalWidth: number;
  logicalHeight: number;
}

export function drawTopDownAsset(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
): void {
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
}

export function createCanvasImage(
  width: number,
  height: number,
  pixelRatio: number,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
): CanvasImage {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(height * pixelRatio));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable');
  context.scale(pixelRatio, pixelRatio);
  context.clearRect(0, 0, width, height);
  draw(context, width, height);
  return {
    canvas,
    data: context.getImageData(0, 0, canvas.width, canvas.height),
    pixelRatio,
    logicalWidth: width,
    logicalHeight: height,
  };
}
