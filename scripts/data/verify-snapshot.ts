import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getRegion } from './regions.ts';
import type { MapDataset } from './types.ts';
import { validateDataset } from './validate.ts';

const regionArgument = process.argv.slice(2).find((argument) => argument.startsWith('--region='));
const regionId = regionArgument?.slice('--region='.length) || 'sumy';
const region = getRegion(regionId);
const dataset = JSON.parse(await readFile(resolve(region.outputPath), 'utf8')) as MapDataset;

validateDataset(dataset);
if (dataset.metadata.region_id !== region.id) {
  throw new Error(`Snapshot region ${dataset.metadata.region_id} does not match ${region.id}`);
}

console.log(`Verified ${region.outputPath}: ${dataset.features.length} features with stable unique IDs`);
