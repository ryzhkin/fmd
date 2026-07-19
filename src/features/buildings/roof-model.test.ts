import { describe, expect, it } from 'vitest';
import { logicalDimensions, roofStyle } from './roof-model';

describe('roof model', () => {
  it.each([
    [{ building_rectangularity: 0.6 }, 'compound'],
    [{ building_area_m2: 260 }, 'manor'],
    [{ building_aspect: 2.2 }, 'long'],
    [{ building_area_m2: 40 }, 'small'],
    [{ building_area_m2: 100, building_aspect: 1.1 }, 'square'],
    [{ building_area_m2: 100, building_aspect: 1.6 }, 'cottage'],
  ])('classifies %o as %s', (properties, expected) => {
    expect(roofStyle({ kind: 'building_icon', ...properties })).toBe(expected);
  });

  it('uses explicit reference-zoom dimensions and clamps extremes', () => {
    expect(logicalDimensions({ kind: 'building_icon', icon_width_z16: 25, icon_height_z16: 12 })).toEqual({ width: 25, height: 12 });
    expect(logicalDimensions({ kind: 'building_icon', icon_width_z16: 1, icon_height_z16: 500 })).toEqual({ width: 4, height: 140 });
  });
});
