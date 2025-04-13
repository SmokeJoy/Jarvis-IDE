import { test, expect } from '@playwright/test';
import { createMockEventBus } from './fixtures/mock-event-bus';
import { createMockStrategy } from './fixtures/mock-strategy';
import { LLMEventType } from '../src/mas/core/fallback/LLMEventBus';

test.describe('Visix WebView Integration', () => {
  test('FallbackMonitorPanel renders correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/preview/fallback-monitor');

    // Verifica elementi base
    await expect(page.locator('text=Fallback Monitor')).toBeVisible();
    await expect(page.locator('text=Strategia Attiva')).toBeVisible();

    // Verifica metriche
    await expect(page.locator('[data-testid="latency-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="cost-chart"]')).toBeVisible();
  });

  test('FallbackAuditPanel responds to events', async ({ page }) => {
    const eventBus = createMockEventBus();
    const strategy = createMockStrategy();

    await page.goto('http://localhost:5173/preview/fallback-audit');

    // Simula evento di successo
    await eventBus.emit(LLMEventType.PROVIDER_SUCCESS, {
      providerId: 'openai',
      timestamp: Date.now()
    });

    // Verifica aggiornamento UI
    await expect(page.locator('text=openai')).toBeVisible();
    await expect(page.locator('text=450ms')).toBeVisible();
    await expect(page.locator('text=$0.02')).toBeVisible();

    // Simula cambio strategia
    await strategy.setActive('cost-based');
    await expect(page.locator('text=cost-based')).toBeVisible();
  });

  test('FallbackChartPanel updates with new data', async ({ page }) => {
    const eventBus = createMockEventBus();

    await page.goto('http://localhost:5173/preview/fallback-chart');
    await page.waitForSelector('[data-testid="chart-container"]');

    // Simula serie di eventi
    for (let i = 0; i < 5; i++) {
      await eventBus.emit(LLMEventType.PROVIDER_SUCCESS, {
        providerId: ['openai', 'anthropic', 'mistral'][i % 3],
        timestamp: Date.now() + i * 1000,
        cost: 0.01 + Math.random() * 0.02
      });
    }

    // Verifica aggiornamento grafici
    await expect(page.locator('[data-testid="latency-chart"] path')).toHaveCount(3);
    await expect(page.locator('[data-testid="success-rate-chart"] rect')).toHaveCount(15);
    
    // Screenshot per regression
    expect(await page.screenshot({
      fullPage: true
    })).toMatchSnapshot('fallback-chart-updated.png');
  });
}); 