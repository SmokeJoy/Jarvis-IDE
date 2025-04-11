import { test, expect } from '@playwright/test';
import { waitForFallbackUpdate, getProviderStats, simulateProviderFailure } from './utils';

test.describe('Fallback Strategy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForFallbackUpdate(page);
  });

  test('should display fallback status', async ({ page }) => {
    const status = page.locator('[data-testid="fallback-status"]');
    await expect(status).toBeVisible();
    const statusText = await status.textContent();
    expect(statusText).toMatch(/active|inactive/i);
  });

  test('should show provider statistics', async ({ page }) => {
    const stats = await getProviderStats(page);
    expect(stats).toBeTruthy();
    expect(stats).toContain('Success Rate');
    expect(stats).toContain('Response Time');
  });

  test('should update statistics on provider failure', async ({ page }) => {
    const initialStats = await getProviderStats(page);
    await simulateProviderFailure(page);
    const updatedStats = await getProviderStats(page);
    expect(updatedStats).not.toBe(initialStats);
  });

  test('should maintain provider order after failures', async ({ page }) => {
    const initialOrder = await page.locator('[data-testid="provider-order"]').textContent();
    await simulateProviderFailure(page);
    const updatedOrder = await page.locator('[data-testid="provider-order"]').textContent();
    expect(updatedOrder).toBe(initialOrder);
  });

  test('FallbackMonitorPanel visual regression', async ({ page }) => {
    await page.waitForSelector('[data-testid="fallback-status"]');
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toMatchSnapshot('fallback-monitor-ui.png');
  });

  test('Handles rapid fallback updates', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await simulateProviderFailure(page);
    }

    const status = await page.locator('[data-testid="fallback-status"]').textContent();
    expect(status).toMatch(/fallback active/i);
  });

  test('Exports audit logs to JSON', async ({ page }) => {
    const exportButton = page.locator('[data-testid="export-json"]');
    await exportButton.click();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/audit.*\.json/);
  });
}); 