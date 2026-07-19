import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('FMD loads and core mobile controls work', async ({ page }) => {
  const pageErrors = [];
  const localRequestFailures = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    if (request.url().startsWith('http://127.0.0.1:4173')) {
      localRequestFailures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`);
    }
  });

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await page.waitForFunction(
    () => typeof map !== 'undefined' && Boolean(map.getLayer('building-icons')),
    null,
    { timeout: 30_000 }
  );

  const papyrusAssetStatus = await page.evaluate(async () => {
    const assetResponse = await fetch('./assets/papyrus-texture.svg', { cache: 'no-store' });
    return assetResponse.status;
  });
  expect(papyrusAssetStatus).toBe(200);

  const squareRoofAssetStatus = await page.evaluate(async () => {
    const assetResponse = await fetch('./assets/house-square-topdown.webp', { cache: 'no-store' });
    return assetResponse.status;
  });
  expect(squareRoofAssetStatus).toBe(200);

  await page.waitForFunction(
    () => map.hasImage('papyrus-texture') && map.getPaintProperty('paper', 'background-pattern') === 'papyrus-texture',
    null,
    { timeout: 30_000 }
  );

  await expect
    .poll(
      () => page.evaluate(() => map.querySourceFeatures('world', {
        filter: ['==', ['get', 'kind'], 'building_icon'],
      }).length),
      { timeout: 30_000, message: 'procedural building icons should be present' }
    )
    .toBeGreaterThan(0);

  await expect(page.locator('body')).toHaveAttribute('data-square-roof-asset', 'loaded');

  const geoJsonStatus = await page.evaluate(async () => {
    const geoJsonResponse = await fetch('./data/map.geojson', { cache: 'no-store' });
    return geoJsonResponse.status;
  });
  expect(geoJsonStatus).toBe(200);

  const fantasyButton = page.getByRole('button', { name: 'Фэнтези' });
  const realityButton = page.getByRole('button', { name: 'Реальность' });
  const footprintsButton = page.getByRole('button', { name: 'Контуры' });

  await expect(fantasyButton).toHaveClass(/active/);
  await expect(footprintsButton).toHaveAttribute('aria-pressed', 'true');

  await footprintsButton.click();
  await expect(footprintsButton).toHaveAttribute('aria-pressed', 'false');
  await footprintsButton.click();
  await expect(footprintsButton).toHaveAttribute('aria-pressed', 'true');

  await realityButton.click();
  await expect(realityButton).toHaveClass(/active/);
  await expect(page.locator('body')).not.toHaveClass(/fantasy/);

  await fantasyButton.click();
  await expect(fantasyButton).toHaveClass(/active/);
  await expect(page.locator('body')).toHaveClass(/fantasy/);

  await page.locator('#status').waitFor({ state: 'detached', timeout: 30_000 });

  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/fmd-iphone-overview.png', fullPage: true });

  await page.evaluate(() => {
    map.jumpTo({ center: [34.7666, 50.8648], zoom: 18.3 });
  });
  await page.waitForFunction(() => !map.isMoving());
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'artifacts/fmd-iphone-houses-detail.png', fullPage: true });

  expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
  expect(localRequestFailures, `local request failures: ${localRequestFailures.join('\n')}`).toEqual([]);
});
