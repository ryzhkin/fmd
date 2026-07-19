import type { ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';

export const REFERENCE_ZOOM = 16;
const REFERENCE_LATITUDE = 50.8650625;
const METERS_PER_PIXEL_AT_EQUATOR_Z0 = 78271.51696402048;
export const METERS_PER_PIXEL_Z16 =
  (METERS_PER_PIXEL_AT_EQUATOR_Z0 * Math.cos((REFERENCE_LATITUDE * Math.PI) / 180)) / 2 ** REFERENCE_ZOOM;

export function mapScaleExpression(scaleProperty?: string): ExpressionSpecification {
  const scale: ExpressionSpecification | null = scaleProperty
    ? ['coalesce', ['get', scaleProperty], 1]
    : null;
  const atZoom = (value: number): number | ExpressionSpecification => scale ? ['*', scale, value] : value;
  return ['interpolate', ['exponential', 2], ['zoom'], 14, atZoom(0.25), 16, atZoom(1), 18, atZoom(4), 20, atZoom(16)];
}

export function symbolLayout(
  image: string | ExpressionSpecification,
  rotationProperty: string,
  scaleProperty?: string,
): SymbolLayerSpecification['layout'] {
  return {
    'icon-image': image,
    'icon-size': mapScaleExpression(scaleProperty),
    'icon-rotate': ['coalesce', ['get', rotationProperty], 0],
    'icon-rotation-alignment': 'map',
    'icon-pitch-alignment': 'map',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
    'icon-padding': 0,
  };
}

export function shadowPaint(opacity: number): SymbolLayerSpecification['paint'] {
  return {
    'icon-opacity': opacity,
    'icon-translate': ['interpolate', ['linear'], ['zoom'], 14, ['literal', [0.25, 0.5]], 16, ['literal', [1, 1.5]], 18, ['literal', [3, 4]], 19, ['literal', [5, 7]]],
    'icon-translate-anchor': 'viewport',
  };
}
