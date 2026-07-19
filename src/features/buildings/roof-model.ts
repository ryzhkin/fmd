import type { BuildingIconProperties, WorldProperties } from '../../data/types';
import { METERS_PER_PIXEL_Z16 } from '../../map/symbols';

export type RoofStyle = 'small' | 'square' | 'cottage' | 'long' | 'manor' | 'compound';

const FOOTPRINT_FILL = 0.94;

export interface LogicalDimensions {
  width: number;
  height: number;
}

export type RoofModelProperties = WorldProperties | (
  { kind: 'building_icon' } & Partial<Omit<BuildingIconProperties, 'kind'>>
);

export const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value));

export function roofStyle(properties: RoofModelProperties): RoofStyle {
  if (properties.roof_style) return properties.roof_style as RoofStyle;
  const legacyStyle = String(properties.building_icon ?? '').replace('house-', '');
  if (['small', 'square', 'cottage', 'long', 'manor', 'compound'].includes(legacyStyle)) {
    return legacyStyle as RoofStyle;
  }
  const area = Number(properties.building_area_m2) || 0;
  const aspect = Number(properties.building_aspect) || 1;
  const rectangularity = Number(properties.building_rectangularity) || 1;
  if (rectangularity < 0.72) return 'compound';
  if (area >= 240) return 'manor';
  if (aspect >= 2.05) return 'long';
  if (area <= 55) return 'small';
  if (aspect <= 1.25) return 'square';
  return 'cottage';
}

export function logicalDimensions(properties: RoofModelProperties): LogicalDimensions {
  const majorMeters = Math.max(1, Number(properties.building_major_m) || 8);
  const minorMeters = Math.max(1, Number(properties.building_minor_m) || 6);
  const width = Number(properties.icon_width_z16) || (majorMeters / METERS_PER_PIXEL_Z16) * FOOTPRINT_FILL;
  const height = Number(properties.icon_height_z16) || (minorMeters / METERS_PER_PIXEL_Z16) * FOOTPRINT_FILL;
  return { width: clamp(width, 4, 180), height: clamp(height, 3, 140) };
}
