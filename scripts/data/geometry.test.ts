import { describe, expect, it } from 'vitest';
import { createLocalProjection, polygonAreaAndCentroid } from './geometry.ts';

describe('data geometry', () => {
  it('calculates area and centroid for a rectangle', () => {
    const result = polygonAreaAndCentroid([[0, 0], [10, 0], [10, 4], [0, 4]]);
    expect(result.area).toBe(40);
    expect(result.centroid).toEqual([5, 2]);
  });

  it('round-trips local coordinates around a region center', () => {
    const projection = createLocalProjection([34.765, 50.865]);
    const point: [number, number] = [34.766, 50.866];
    const restored = projection.fromLocalMeters(projection.toLocalMeters(point));
    expect(restored[0]).toBeCloseTo(point[0], 10);
    expect(restored[1]).toBeCloseTo(point[1], 10);
  });
});
