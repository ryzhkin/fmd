import type { Position } from './types.ts';

const EARTH_RADIUS_METERS = 6_378_137;

export interface LocalProjection {
  toLocalMeters(position: Position): Position;
  fromLocalMeters(position: Position): Position;
}

export function createLocalProjection(center: Position): LocalProjection {
  const latitudeScale = Math.cos((center[1] * Math.PI) / 180);
  return {
    toLocalMeters([lon, lat]) {
      return [
        EARTH_RADIUS_METERS * ((lon - center[0]) * Math.PI / 180) * latitudeScale,
        EARTH_RADIUS_METERS * ((lat - center[1]) * Math.PI / 180),
      ];
    },
    fromLocalMeters([x, y]) {
      return [
        center[0] + (x / (EARTH_RADIUS_METERS * latitudeScale)) * (180 / Math.PI),
        center[1] + (y / EARTH_RADIUS_METERS) * (180 / Math.PI),
      ];
    },
  };
}

export function polygonAreaAndCentroid(points: Position[]): { area: number; centroid: Position } {
  let doubledArea = 0;
  let centroidX = 0;
  let centroidY = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    const cross = current[0] * next[1] - next[0] * current[1];
    doubledArea += cross;
    centroidX += (current[0] + next[0]) * cross;
    centroidY += (current[1] + next[1]) * cross;
  }
  if (Math.abs(doubledArea) < 0.001) {
    const average = points.reduce<Position>((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]);
    return { area: 0, centroid: [average[0] / points.length, average[1] / points.length] };
  }
  return {
    area: Math.abs(doubledArea) / 2,
    centroid: [centroidX / (3 * doubledArea), centroidY / (3 * doubledArea)],
  };
}
