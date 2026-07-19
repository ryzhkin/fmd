import { loadOptionalImage } from '../../assets/images';
import type { RoofStyle } from './roof-model';

export type DetailedRoofStyle = Extract<RoofStyle, 'square' | 'cottage' | 'long'>;

export interface DetailedRoofDefinition {
  url: string;
  label: string;
  atlasBudgetBytes: number;
}

const base = import.meta.env.BASE_URL;
export const DETAILED_ROOFS: Record<DetailedRoofStyle, DetailedRoofDefinition> = {
  square: { url: `${base}assets/house-square-topdown.webp`, label: 'квадратных', atlasBudgetBytes: 32 * 1024 * 1024 },
  cottage: { url: `${base}assets/house-cottage-topdown.webp`, label: 'прямоугольных', atlasBudgetBytes: 24 * 1024 * 1024 },
  long: { url: `${base}assets/house-long-topdown.webp`, label: 'сильно вытянутых', atlasBudgetBytes: 8 * 1024 * 1024 },
};

export type DetailedRoofImages = Partial<Record<DetailedRoofStyle, HTMLImageElement>>;

export async function loadDetailedRoofImages(): Promise<DetailedRoofImages> {
  const entries = await Promise.all(
    Object.entries(DETAILED_ROOFS).map(async ([style, roof]) => {
      const image = await loadOptionalImage(roof.url, `Detailed ${style} roof is unavailable; using procedural fallback`);
      return [style, image] as const;
    }),
  );
  return Object.fromEntries(entries.filter((entry): entry is readonly [DetailedRoofStyle, HTMLImageElement] => Boolean(entry[1])));
}
