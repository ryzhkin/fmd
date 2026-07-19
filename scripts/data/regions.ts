import type { RegionDefinition } from './types.ts';

const regions = {
  sumy: {
    id: 'sumy-v1',
    name: 'FMD Sumy 2x2 km experiment',
    center: [34.765046875, 50.8650625],
    bbox: {
      south: 50.85607938825009,
      west: 34.75081392347039,
      north: 50.874045611749914,
      east: 34.77927982652962,
    },
    plusCode: '9G2PVQ88+22F',
    areaLabel: '2x2 km',
    outputPath: 'public/data/regions/sumy.geojson',
  },
} satisfies Record<string, RegionDefinition>;

export type RegionId = keyof typeof regions;

export function getRegion(id: string): RegionDefinition {
  const region = regions[id as RegionId];
  if (!region) {
    throw new Error(`Unknown region "${id}". Available regions: ${Object.keys(regions).join(', ')}`);
  }
  return region;
}
