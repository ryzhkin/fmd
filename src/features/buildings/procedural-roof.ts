import type { RoofStyle } from './roof-model';
import { clamp } from './roof-model';

interface RoofSurfaceOptions {
  fill?: string;
  ridge?: boolean;
  crossRidge?: boolean;
}

function roundedRectangle(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawRoofSurface(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, options: RoofSurfaceOptions = {}): void {
  const shortestSide = Math.min(width, height);
  context.save();
  roundedRectangle(context, x, y, width, height, clamp(shortestSide * 0.08, 0.35, 2.4));
  context.fillStyle = options.fill ?? '#bd8242';
  context.fill();
  context.lineWidth = clamp(shortestSide * 0.07, 0.45, 1.8);
  context.strokeStyle = '#5a361e';
  context.stroke();

  if (options.ridge !== false) {
    context.beginPath();
    context.moveTo(x + width * 0.06, y + height * 0.5);
    context.lineTo(x + width * 0.94, y + height * 0.5);
    context.strokeStyle = '#6b4122';
    context.lineWidth = clamp(shortestSide * 0.045, 0.35, 1.2);
    context.stroke();
  }
  context.beginPath();
  context.moveTo(x + width * 0.08, y + height * 0.15);
  context.lineTo(x + width * 0.92, y + height * 0.15);
  context.strokeStyle = 'rgba(246, 202, 123, .68)';
  context.lineWidth = clamp(shortestSide * 0.025, 0.25, 0.7);
  context.stroke();
  if (options.crossRidge) {
    context.beginPath();
    context.moveTo(x + width * 0.5, y + height * 0.08);
    context.lineTo(x + width * 0.5, y + height * 0.92);
    context.strokeStyle = '#6b4122';
    context.lineWidth = clamp(shortestSide * 0.045, 0.35, 1.2);
    context.stroke();
  }
  context.restore();
}

export function drawProceduralHouse(context: CanvasRenderingContext2D, width: number, height: number, style: RoofStyle): void {
  const inset = clamp(Math.min(width, height) * 0.035, 0.25, 1.1);
  const x = inset;
  const y = inset;
  const usableWidth = Math.max(1, width - inset * 2);
  const usableHeight = Math.max(1, height - inset * 2);
  if (style === 'compound' && usableWidth > 7 && usableHeight > 5) {
    drawRoofSurface(context, x, y, usableWidth, usableHeight * 0.61, { fill: '#b8793e' });
    drawRoofSurface(context, x, y + usableHeight * 0.37, usableWidth * 0.5, usableHeight * 0.63, { fill: '#c18748', crossRidge: true });
    return;
  }
  const fills: Partial<Record<RoofStyle, string>> = {
    small: '#c39152', square: '#c18a49', cottage: '#bf8443', long: '#ad7339', manor: '#a96838',
  };
  drawRoofSurface(context, x, y, usableWidth, usableHeight, {
    fill: fills[style] ?? '#bd8242',
    crossRidge: style === 'square' || style === 'manor',
  });
  if (style === 'long' && usableWidth > 14) {
    context.save();
    context.fillStyle = '#e0b367';
    const markWidth = clamp(usableHeight * 0.08, 0.35, 1.2);
    const markHeight = clamp(usableHeight * 0.18, 0.7, 2.2);
    for (let markX = x + usableWidth * 0.2; markX < x + usableWidth * 0.86; markX += usableWidth * 0.22) {
      context.fillRect(markX, y + usableHeight * 0.18, markWidth, markHeight);
    }
    context.restore();
  }
  if (style === 'cottage' && usableWidth > 9 && usableHeight > 5) {
    context.save();
    context.fillStyle = '#724325';
    context.fillRect(x + usableWidth * 0.76, y + usableHeight * 0.04, clamp(usableHeight * 0.12, 0.5, 1.5), clamp(usableHeight * 0.24, 0.9, 2.8));
    context.restore();
  }
  if (style === 'manor' && usableWidth > 12 && usableHeight > 7) {
    context.save();
    context.fillStyle = 'rgba(238, 181, 91, .82)';
    const dormerWidth = clamp(usableWidth * 0.08, 0.8, 3);
    const dormerHeight = clamp(usableHeight * 0.13, 0.8, 2.6);
    context.fillRect(x + usableWidth * 0.22, y + usableHeight * 0.22, dormerWidth, dormerHeight);
    context.fillRect(x + usableWidth * 0.7, y + usableHeight * 0.22, dormerWidth, dormerHeight);
    context.restore();
  }
}
