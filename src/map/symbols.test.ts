import { describe, expect, it } from 'vitest';
import { mapScaleExpression } from './symbols';

describe('mapScaleExpression', () => {
  it('preserves exact 2^(zoom - 16) footprint scaling', () => {
    expect(mapScaleExpression()).toEqual([
      'interpolate', ['exponential', 2], ['zoom'],
      14, 0.25,
      16, 1,
      18, 4,
      20, 16,
    ]);
  });

  it('applies a per-feature multiplier without changing zoom scaling', () => {
    const expression = mapScaleExpression('tree_scale');
    expect(expression).toContain('interpolate');
    expect(JSON.stringify(expression)).toContain('tree_scale');
  });
});
