import { test, expect } from '@playwright/test';

const ZOOM_CASES = [
  [15.2, 'fantasy-z15-2.png'],
  [18.3, 'fantasy-z18-3.png'],
  [19, 'fantasy-z19.png'],
];

// Stable square house from the checked-in Sumy snapshot. Keeping the camera on
// the same footprint makes the baselines exercise icon-to-geometry scaling.
const VISUAL_TEST_CENTER = [34.76452008333017, 50.86653554985532];

test('fantasy rendering stays structurally and visually stable', async ({ page }) => {
  const consoleErrors = [];
  const requestFailures = [];
  const httpErrors = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', request => {
    requestFailures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`);
  });
  page.on('response', response => {
    if (!response.ok()) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveAttribute('data-app-ready', 'true', { timeout: 30_000 });
  await page.locator('#status').waitFor({ state: 'detached', timeout: 10_000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.__FMD_E2E__))).toBe(true);

  const diagnostics = await page.evaluate(() => window.__FMD_E2E__?.diagnostics());
  expect(diagnostics).toBeTruthy();
  expect(diagnostics.buildingShadowAnchor).toBe('viewport');
  expect(diagnostics.treeShadowAnchor).toBe('viewport');
  expect(diagnostics.papyrusReady).toBe(true);
  expect(diagnostics.buildingIcons).toBeGreaterThan(0);
  expect(diagnostics.treeDecorations).toBeGreaterThan(0);

  const indexes = diagnostics.layerOrder.map(entry => Number(entry.split(':', 1)[0]));
  expect(indexes.every(index => index >= 0)).toBe(true);
  expect(indexes).toEqual([...indexes].sort((left, right) => left - right));

  for (const [zoom, screenshot] of ZOOM_CASES) {
    await page.evaluate(
      ({ value, center }) => window.__FMD_E2E__?.jumpTo(value, center),
      { value: zoom, center: VISUAL_TEST_CENTER },
    );
    await expect.soft(page).toHaveScreenshot(screenshot, {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.015,
    });
  }

  expect(httpErrors, `HTTP errors: ${httpErrors.join('\n')}`).toEqual([]);
  expect(requestFailures, `request failures: ${requestFailures.join('\n')}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([]);
});
