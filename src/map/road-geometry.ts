import type { FeatureCollection, Geometry, LineString, MultiLineString, Position } from 'geojson';
import type { MapDataset, WorldProperties } from '../data/types';

const CURVE_STEPS = 8;
const TANGENT_STRENGTH = 0.65;

type Point = [x: number, y: number];

function distance([leftX, leftY]: Point, [rightX, rightY]: Point): number {
  return Math.hypot(rightX - leftX, rightY - leftY);
}

function tangent(points: Point[], index: number): Point {
  const current = points[index]!;
  const previous = points[Math.max(0, index - 1)]!;
  const next = points[Math.min(points.length - 1, index + 1)]!;
  const directionX = next[0] - previous[0];
  const directionY = next[1] - previous[1];
  const directionLength = Math.hypot(directionX, directionY);
  if (directionLength === 0) return [0, 0];

  const adjacentLength = index === 0
    ? distance(current, next)
    : index === points.length - 1
      ? distance(previous, current)
      : Math.min(distance(previous, current), distance(current, next));
  const magnitude = adjacentLength * TANGENT_STRENGTH;
  return [directionX / directionLength * magnitude, directionY / directionLength * magnitude];
}

function interpolateHermite(start: Point, end: Point, startTangent: Point, endTangent: Point, t: number): Point {
  const squared = t * t;
  const cubed = squared * t;
  const startWeight = 2 * cubed - 3 * squared + 1;
  const startTangentWeight = cubed - 2 * squared + t;
  const endWeight = -2 * cubed + 3 * squared;
  const endTangentWeight = cubed - squared;
  return [
    startWeight * start[0] + startTangentWeight * startTangent[0] + endWeight * end[0] + endTangentWeight * endTangent[0],
    startWeight * start[1] + startTangentWeight * startTangent[1] + endWeight * end[1] + endTangentWeight * endTangent[1],
  ];
}

export function smoothRoadCoordinates(coordinates: Position[]): Position[] {
  if (coordinates.length < 3) return coordinates.map(coordinate => [...coordinate]);

  const referenceLatitude = coordinates.reduce((sum, coordinate) => sum + coordinate[1]!, 0) / coordinates.length;
  const longitudeScale = Math.max(Math.abs(Math.cos(referenceLatitude * Math.PI / 180)), 1e-6);
  const points: Point[] = coordinates.map(coordinate => [coordinate[0]! * longitudeScale, coordinate[1]!]);
  const tangents = points.map((_, index) => tangent(points, index));
  const smoothed: Position[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    for (let step = 0; step < CURVE_STEPS; step += 1) {
      const [x, latitude] = interpolateHermite(
        points[index]!,
        points[index + 1]!,
        tangents[index]!,
        tangents[index + 1]!,
        step / CURVE_STEPS,
      );
      smoothed.push([x / longitudeScale, latitude]);
    }
  }
  smoothed.push([...coordinates.at(-1)!]);
  return smoothed;
}

function smoothRoadGeometry(geometry: Geometry): Geometry {
  if (geometry.type === 'LineString') {
    return { ...geometry, coordinates: smoothRoadCoordinates(geometry.coordinates) } satisfies LineString;
  }
  if (geometry.type === 'MultiLineString') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(smoothRoadCoordinates),
    } satisfies MultiLineString;
  }
  return geometry;
}

export function createRoadDisplayDataset(dataset: MapDataset): FeatureCollection<Geometry, WorldProperties> {
  return {
    type: 'FeatureCollection',
    features: dataset.features
      .filter(feature => feature.properties.kind === 'road')
      .map(feature => ({ ...feature, geometry: smoothRoadGeometry(feature.geometry) })),
  };
}
