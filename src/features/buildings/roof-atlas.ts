import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapDataset, WorldProperties } from '../../data/types';
import { createCanvasImage, drawTopDownAsset, type CanvasImage } from '../../rendering/canvas';
import { createShadowImage, SHADOW_CANVAS_SCALE } from '../../rendering/shadow';
import { drawProceduralHouse } from './procedural-roof';
import { DETAILED_ROOFS, type DetailedRoofImages, type DetailedRoofStyle } from './roof-assets';
import { logicalDimensions, roofStyle } from './roof-model';

const PROCEDURAL_PIXEL_RATIO = 4;
const DETAILED_ROOF_MAX_PIXEL_RATIO = 16;
const RGBA_BYTES_PER_PIXEL = 4;
const MAX_ICON_EDGE = 1024;
const MAX_RENDER_ZOOM = 19;
const REFERENCE_ZOOM = 16;
const SHADOW_MAX_PIXEL_RATIO = 4;
const SHADOW_ATLAS_BUDGET_BYTES = 12 * 1024 * 1024;

interface ImageRatios {
  detailedRoofs: Partial<Record<DetailedRoofStyle, number>>;
  shadow: number;
}

function boundedPixelRatio(logicalArea: number, desiredRatio: number, maximumRatio: number, budgetBytes: number): number {
  const budgetRatio = logicalArea > 0 ? Math.sqrt(budgetBytes / (logicalArea * RGBA_BYTES_PER_PIXEL)) : maximumRatio;
  return Math.max(1, Math.min(maximumRatio, desiredRatio, budgetRatio));
}

function buildingImageRatios(dataset: MapDataset, detailedRoofImages: DetailedRoofImages): ImageRatios {
  const zoomScale = 2 ** (MAX_RENDER_ZOOM - REFERENCE_ZOOM);
  const displayRatio = Math.max(1, window.devicePixelRatio || 1);
  const styles = Object.keys(detailedRoofImages) as DetailedRoofStyle[];
  const areas: Partial<Record<DetailedRoofStyle, number>> = Object.fromEntries(styles.map(style => [style, 0]));
  let shadowArea = 0;
  for (const feature of dataset.features) {
    if (feature.properties.kind !== 'building_icon') continue;
    const dimensions = logicalDimensions(feature.properties);
    const area = dimensions.width * dimensions.height;
    const style = roofStyle(feature.properties);
    if (style in areas) areas[style as DetailedRoofStyle] = (areas[style as DetailedRoofStyle] ?? 0) + area;
    shadowArea += area * SHADOW_CANVAS_SCALE ** 2;
  }
  const detailedRoofs: Partial<Record<DetailedRoofStyle, number>> = {};
  for (const style of styles) {
    detailedRoofs[style] = boundedPixelRatio(
      areas[style] ?? 0,
      displayRatio * zoomScale,
      DETAILED_ROOF_MAX_PIXEL_RATIO,
      DETAILED_ROOFS[style].atlasBudgetBytes,
    );
  }
  return {
    detailedRoofs,
    shadow: boundedPixelRatio(shadowArea, displayRatio * 2, SHADOW_MAX_PIXEL_RATIO, SHADOW_ATLAS_BUDGET_BYTES),
  };
}

function createHouseImage(properties: WorldProperties, images: DetailedRoofImages, ratios: ImageRatios['detailedRoofs']): CanvasImage {
  const style = roofStyle(properties);
  const detailedStyle = style as DetailedRoofStyle;
  const detailedImage = images[detailedStyle] ?? null;
  const dimensions = logicalDimensions(properties);
  const pixelRatio = detailedImage
    ? Math.max(1, Math.min(ratios[detailedStyle] ?? 1, MAX_ICON_EDGE / Math.max(dimensions.width, dimensions.height)))
    : PROCEDURAL_PIXEL_RATIO;
  return createCanvasImage(dimensions.width, dimensions.height, pixelRatio, (context, width, height) => {
    if (detailedImage) drawTopDownAsset(context, detailedImage, width, height);
    else drawProceduralHouse(context, width, height, style);
  });
}

function safeImageId(properties: WorldProperties, fallback: string | number | undefined): string {
  const sourceId = properties.source_osm_id ?? properties.osm_id ?? fallback;
  return String(sourceId).replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function prepareBuildingIcons(map: MapLibreMap, dataset: MapDataset, images: DetailedRoofImages): void {
  const ratios = buildingImageRatios(dataset, images);
  for (const feature of dataset.features) {
    const properties = feature.properties;
    if (properties.kind !== 'building_icon') continue;
    const id = safeImageId(properties, feature.id);
    const imageName = `procedural-house-${id}`;
    const shadowName = `procedural-house-shadow-${id}`;
    properties.building_icon = imageName;
    properties.building_shadow_icon = shadowName;
    if (map.hasImage(imageName) && map.hasImage(shadowName)) continue;
    const houseImage = createHouseImage(properties, images, ratios.detailedRoofs);
    if (!map.hasImage(imageName)) map.addImage(imageName, houseImage.data, { pixelRatio: houseImage.pixelRatio });
    if (!map.hasImage(shadowName)) {
      const shadow = createShadowImage(houseImage, ratios.shadow);
      map.addImage(shadowName, shadow.data, { pixelRatio: shadow.pixelRatio });
    }
  }
}
