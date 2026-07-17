import { mkdir, writeFile } from 'node:fs/promises';

const CENTER = [34.765046875, 50.8650625];
const BBOX = {
  south: 50.85607938825009,
  west: 34.75081392347039,
  north: 50.874045611749914,
  east: 34.77927982652962,
};

const query = `[out:json][timeout:90];
(
  way[highway](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way[building](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way[waterway](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way[natural=water](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way[natural=wood](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way[landuse](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way[leisure=park](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node[place](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node[amenity](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node[tourism](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom;`;

const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];

async function fetchOsm() {
  const body = new URLSearchParams({ data: query });
  let lastError;

  for (const endpoint of endpoints) {
    try {
      console.log(`Fetching OSM data from ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'fmd-github-pages-demo/1.0',
        },
        body,
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data.elements)) {
        throw new Error('Overpass response has no elements array');
      }
      return data;
    } catch (error) {
      lastError = error;
      console.warn(`Endpoint failed: ${error.message}`);
    }
  }

  throw new Error(`All Overpass endpoints failed: ${lastError?.message ?? 'unknown error'}`);
}

function isArea(tags = {}, coordinates = []) {
  if (coordinates.length < 4) return false;
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const closed = first[0] === last[0] && first[1] === last[1];
  if (!closed) return false;

  return Boolean(
    tags.building ||
    tags.landuse ||
    tags.leisure === 'park' ||
    tags.natural === 'water' ||
    tags.natural === 'wood' ||
    tags.area === 'yes'
  );
}

function category(tags = {}, geometryType) {
  if (tags.building) return 'building';
  if (tags.highway) return 'road';
  if (tags.waterway) return 'waterway';
  if (tags.natural === 'water') return 'water';
  if (tags.natural === 'wood' || tags.landuse === 'forest') return 'forest';
  if (tags.landuse === 'residential') return 'residential';
  if (tags.landuse === 'industrial') return 'industrial';
  if (tags.landuse === 'commercial' || tags.landuse === 'retail') return 'commercial';
  if (tags.landuse === 'grass' || tags.landuse === 'meadow' || tags.leisure === 'park') return 'green';
  if (geometryType === 'Point') return 'poi';
  return 'other';
}

function centroidOfRing(ring) {
  if (!ring.length) return CENTER;
  let x = 0;
  let y = 0;
  for (const coordinate of ring) {
    x += coordinate[0];
    y += coordinate[1];
  }
  return [x / ring.length, y / ring.length];
}

function fantasyIcon(kind, tags = {}) {
  if (kind === 'forest') return '♠';
  if (kind === 'water' || kind === 'waterway') return '≈';
  if (kind === 'building') {
    if (tags.amenity === 'place_of_worship') return '♜';
    return '⌂';
  }
  if (kind === 'poi') {
    if (tags.amenity === 'school' || tags.amenity === 'university') return '✦';
    if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return '✚';
    if (tags.tourism) return '◆';
    return '•';
  }
  return '';
}

function toGeoJson(osm) {
  const features = [];
  const labelFeatures = [];

  for (const element of osm.elements) {
    const tags = element.tags ?? {};

    if (element.type === 'node' && Number.isFinite(element.lon) && Number.isFinite(element.lat)) {
      const kind = category(tags, 'Point');
      features.push({
        type: 'Feature',
        id: `node/${element.id}`,
        properties: {
          ...tags,
          osm_id: element.id,
          osm_type: 'node',
          kind,
          label: tags.name ?? tags['name:uk'] ?? '',
          fantasy_icon: fantasyIcon(kind, tags),
        },
        geometry: { type: 'Point', coordinates: [element.lon, element.lat] },
      });
      continue;
    }

    if (element.type !== 'way' || !Array.isArray(element.geometry) || element.geometry.length < 2) {
      continue;
    }

    const coordinates = element.geometry.map(({ lon, lat }) => [lon, lat]);
    const area = isArea(tags, coordinates);
    const geometry = area
      ? { type: 'Polygon', coordinates: [coordinates] }
      : { type: 'LineString', coordinates };
    const kind = category(tags, geometry.type);
    const label = tags.name ?? tags['name:uk'] ?? '';

    features.push({
      type: 'Feature',
      id: `way/${element.id}`,
      properties: {
        ...tags,
        osm_id: element.id,
        osm_type: 'way',
        kind,
        label,
      },
      geometry,
    });

    if (area && (kind === 'forest' || kind === 'building' || kind === 'water') && coordinates.length) {
      labelFeatures.push({
        type: 'Feature',
        id: `label/${element.id}`,
        properties: {
          kind,
          label,
          fantasy_icon: fantasyIcon(kind, tags),
        },
        geometry: { type: 'Point', coordinates: centroidOfRing(coordinates) },
      });
    }
  }

  features.push({
    type: 'Feature',
    id: 'demo-center',
    properties: {
      kind: 'center',
      label: 'VQ88+22F',
      fantasy_icon: '✧',
    },
    geometry: { type: 'Point', coordinates: CENTER },
  });

  return {
    type: 'FeatureCollection',
    name: 'FMD Sumy 2x2 km experiment',
    bbox: [BBOX.west, BBOX.south, BBOX.east, BBOX.north],
    metadata: {
      center: CENTER,
      plus_code: '9G2PVQ88+22F',
      area: '2x2 km',
      generated_at: new Date().toISOString(),
      source: 'OpenStreetMap via Overpass API',
    },
    features: [...features, ...labelFeatures],
  };
}

const osm = await fetchOsm();
const geojson = toGeoJson(osm);
await mkdir('data', { recursive: true });
await writeFile('data/map.geojson', `${JSON.stringify(geojson)}\n`, 'utf8');
console.log(`Created data/map.geojson with ${geojson.features.length} features`);
