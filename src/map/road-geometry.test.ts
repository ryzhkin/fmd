import { describe, expect, it } from 'vitest';
import { smoothRoadCoordinates } from './road-geometry';

function normalizedDirection(from: number[], to: number[]): [number, number] {
  const x = to[0]! - from[0]!;
  const y = to[1]! - from[1]!;
  const length = Math.hypot(x, y);
  return [x / length, y / length];
}

describe('smoothRoadCoordinates', () => {
  it('keeps endpoints and every original road node', () => {
    const original = [[34, 50], [34.001, 50], [34.001, 50.001]];
    const smoothed = smoothRoadCoordinates(original);

    expect(smoothed).toHaveLength(17);
    expect(smoothed[0]).toEqual(original[0]);
    expect(smoothed[8]).toEqual(original[1]);
    expect(smoothed[16]).toEqual(original[2]);
  });

  it('turns a right angle into a continuous curve', () => {
    const smoothed = smoothRoadCoordinates([[34, 50], [34.001, 50], [34.001, 50.001]]);
    const incoming = normalizedDirection(smoothed[7]!, smoothed[8]!);
    const outgoing = normalizedDirection(smoothed[8]!, smoothed[9]!);

    expect(incoming[0] * outgoing[0] + incoming[1] * outgoing[1]).toBeGreaterThan(0.75);
  });

  it('does not add points to an already straight two-node road', () => {
    expect(smoothRoadCoordinates([[34, 50], [34.001, 50.001]])).toEqual([
      [34, 50],
      [34.001, 50.001],
    ]);
  });
});
