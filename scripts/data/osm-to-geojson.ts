import type {
  MapDataset,
  MapFeature,
  OsmElement,
  OsmResponse,
  Position,
  RegionDefinition,
} from './types.ts';

function isArea(tags: Record<string, string>, coordinates: Position[]): boolean {
  if (coordinates.length < 4) return false;
  const first = coordinates[0]!;
  const last = coordinates.at(-1)!;
  if (first[0] !== last[0] || first[1] !== last[1]) return false;
  return Boolean(
    tags.building || tags.landuse || tags.leisure === 'park' ||
    tags.natural === 'water' || tags.natural === 'wood' || tags.area === 'yes',
  );
}

function category(tags: Record<string, string>, geometryType: string): string {
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

function fantasyIcon(kind: string, tags: Record<string, string>): string {
  if (kind === 'forest') return '♠';
  if (kind === 'water' || kind === 'waterway') return '≈';
  if (kind === 'building') return tags.amenity === 'place_of_worship' ? '♜' : '⌂';
  if (kind === 'poi') {
    if (tags.amenity === 'school' || tags.amenity === 'university') return '✦';
    if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return '✚';
    return tags.tourism ? '◆' : '•';
  }
  return '';
}

function centroidOfRing(ring: Position[], fallback: Position): Position {
  if (!ring.length) return fallback;
  const sum = ring.reduce<Position>((result, point) => [result[0] + point[0], result[1] + point[1]], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
}

function stableElementOrder(left: OsmElement, right: OsmElement): number {
  return left.type.localeCompare(right.type) || left.id - right.id;
}

export function osmToGeoJson(
  osm: OsmResponse,
  region: RegionDefinition,
  refreshedAt: string,
): MapDataset {
  const features: MapFeature[] = [];
  const labels: MapFeature[] = [];

  for (const element of [...osm.elements].sort(stableElementOrder)) {
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
        geometry: { type: 'Point', coordinates: [element.lon!, element.lat!] },
      });
      continue;
    }

    if (element.type !== 'way' || !element.geometry || element.geometry.length < 2) continue;
    const coordinates = element.geometry.map<Position>(({ lon, lat }) => [lon, lat]);
    const area = isArea(tags, coordinates);
    const kind = category(tags, area ? 'Polygon' : 'LineString');
    const label = tags.name ?? tags['name:uk'] ?? '';
    features.push({
      type: 'Feature',
      id: `way/${element.id}`,
      properties: { ...tags, osm_id: element.id, osm_type: 'way', kind, label },
      geometry: area
        ? { type: 'Polygon', coordinates: [coordinates] }
        : { type: 'LineString', coordinates },
    });

    if (area && ['forest', 'building', 'water'].includes(kind)) {
      labels.push({
        type: 'Feature',
        id: `label/${element.id}`,
        properties: { kind, label, fantasy_icon: fantasyIcon(kind, tags) },
        geometry: { type: 'Point', coordinates: centroidOfRing(coordinates, region.center) },
      });
    }
  }

  features.push({
    type: 'Feature',
    id: 'demo-center',
    properties: { kind: 'center', label: region.plusCode.slice(-8), fantasy_icon: '✧' },
    geometry: { type: 'Point', coordinates: region.center },
  });

  return {
    type: 'FeatureCollection',
    name: region.name,
    bbox: [region.bbox.west, region.bbox.south, region.bbox.east, region.bbox.north],
    metadata: {
      region_id: region.id,
      center: region.center,
      plus_code: region.plusCode,
      area: region.areaLabel,
      refreshed_at: refreshedAt,
      source: 'OpenStreetMap via Overpass API',
    },
    features: [...features, ...labels],
  };
}
