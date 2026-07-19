import type { RegionDefinition } from '../data/types';

export const SUMY_REGION = Object.freeze({
  id: 'sumy-v1',
  title: 'Сумы',
  center: [34.765046875, 50.8650625],
  bounds: [[34.75081392347039, 50.85607938825009], [34.77927982652962, 50.874045611749914]],
  maxBounds: [[34.735, 50.846], [34.795, 50.884]],
  initialZoom: 15.2,
  datasetUrl: `${import.meta.env.BASE_URL}data/regions/sumy.geojson`,
} as const satisfies RegionDefinition);
