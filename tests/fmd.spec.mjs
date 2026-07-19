import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('FMD loads and core mobile controls work', async ({ page }) => {
  const pageErrors = [];
  const localRequestFailures = [];
  let datasetRequests = 0;

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    if (request.url().includes('/data/regions/sumy.geojson')) datasetRequests += 1;
  });
  page.on('requestfailed', request => {
    if (request.url().startsWith('http://127.0.0.1:4273')) {
      localRequestFailures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`);
    }
  });

  const response = await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('.maplibregl-canvas')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-app-ready', 'true', { timeout: 30_000 });
  await expect(page.locator('#status')).toBeHidden();

  await expect(page.locator('body')).toHaveAttribute('data-square-roof-asset', 'loaded');
  await expect(page.locator('body')).toHaveAttribute('data-cottage-roof-asset', 'loaded');
  await expect(page.locator('body')).toHaveAttribute('data-long-roof-asset', 'loaded');
  await expect(page.locator('body')).toHaveAttribute('data-tree-asset', 'loaded');
  expect(datasetRequests).toBe(1);
  expect(await page.evaluate(() => window.map === document.getElementById('map'))).toBe(true);

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
  await expect(page.locator('body')).toHaveClass(/fantasy/);

  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/fmd-iphone-overview.png', fullPage: true });
  const zoomIn = page.getByRole('button', { name: 'Zoom in' });
  await zoomIn.click();
  await zoomIn.click();
  await zoomIn.click();
  await page.waitForTimeout(1_000);
  await page.screenshot({ path: 'artifacts/fmd-iphone-houses-detail.png', fullPage: true });

  expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
  expect(localRequestFailures, `local request failures: ${localRequestFailures.join('\n')}`).toEqual([]);
});
