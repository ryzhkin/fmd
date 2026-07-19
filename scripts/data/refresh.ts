import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { enrichBuildings } from './buildings.ts';
import { osmToGeoJson } from './osm-to-geojson.ts';
import { fetchOsm } from './overpass.ts';
import { getRegion } from './regions.ts';
import { validateDataset } from './validate.ts';

interface CliOptions {
  regionId: string;
  refreshedAt: string;
}

function parseArgs(args: string[]): CliOptions {
  let regionId = 'sumy';
  let refreshedAt = new Date().toISOString();
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument === '--region') regionId = args[++index] ?? '';
    else if (argument.startsWith('--region=')) regionId = argument.slice('--region='.length);
    else if (argument === '--refreshed-at') refreshedAt = args[++index] ?? '';
    else if (argument.startsWith('--refreshed-at=')) refreshedAt = argument.slice('--refreshed-at='.length);
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!regionId) throw new Error('--region requires a value');
  if (!Number.isFinite(Date.parse(refreshedAt))) throw new Error('--refreshed-at must be an ISO date');
  return { regionId, refreshedAt: new Date(refreshedAt).toISOString() };
}

async function main(): Promise<void> {
  const { regionId, refreshedAt } = parseArgs(process.argv.slice(2));
  const region = getRegion(regionId);
  const osm = await fetchOsm(region);
  const dataset = enrichBuildings(osmToGeoJson(osm, region, refreshedAt), region);
  validateDataset(dataset);

  const outputPath = resolve(region.outputPath);
  const temporaryPath = `${outputPath}.tmp`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(dataset)}\n`, 'utf8');
  await rename(temporaryPath, outputPath);

  const roofs = dataset.features.filter((feature) => feature.properties.kind === 'building_icon').length;
  const trees = dataset.features.filter((feature) => feature.properties.kind === 'tree_decoration').length;
  console.log(`Created ${region.outputPath}: ${dataset.features.length} features, ${roofs} roofs, ${trees} trees`);
}

await main();
