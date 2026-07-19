import type { OsmResponse, RegionDefinition } from './types.ts';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];

function queryFor(region: RegionDefinition): string {
  const { south, west, north, east } = region.bbox;
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:90];
(
  way[highway](${bbox});
  way[building](${bbox});
  way[waterway](${bbox});
  way[natural=water](${bbox});
  way[natural=wood](${bbox});
  way[landuse](${bbox});
  way[leisure=park](${bbox});
  node[place](${bbox});
  node[amenity](${bbox});
  node[tourism](${bbox});
);
out geom;`;
}

export async function fetchOsm(
  region: RegionDefinition,
  signal?: AbortSignal,
): Promise<OsmResponse> {
  const body = new URLSearchParams({ data: queryFor(region) });
  let lastError: unknown;

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`Fetching OSM data from ${endpoint}`);
      const timeoutSignal = AbortSignal.timeout(120_000);
      const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'fmd-data-refresh/1.0',
        },
        body,
        signal: requestSignal,
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

      const data = (await response.json()) as Partial<OsmResponse>;
      if (!Array.isArray(data.elements)) throw new Error('Overpass response has no elements array');
      return { elements: data.elements };
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      lastError = error;
      console.warn(`Endpoint failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error');
  throw new Error(`All Overpass endpoints failed: ${message}`);
}
