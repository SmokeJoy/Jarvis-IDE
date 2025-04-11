import { Page } from '@playwright/test';

export async function waitForFallbackUpdate(page: Page) {
  await page.waitForFunction(() => {
    const status = document.querySelector('[data-testid="fallback-status"]');
    return status && status.textContent !== '';
  });
}

export async function getProviderStats(page: Page) {
  const stats = await page.locator('[data-testid="provider-stats"]').textContent();
  return stats;
}

export async function simulateProviderFailure(page: Page) {
  await page.click('[data-testid="simulate-failure"]');
  await waitForFallbackUpdate(page);
}

export async function waitForUIStability(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

export async function getAuditLogs(page: Page) {
  return await page.evaluate(() => {
    const logs = document.querySelector('[data-testid="audit-logs"]');
    return logs ? logs.textContent : null;
  });
} 