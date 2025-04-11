# Test End-to-End Visix

## 🚀 Setup Ambiente

### Prerequisiti
- Node.js 18+
- pnpm 8+
- VSCode
- Playwright

### Installazione
```bash
# Installa Playwright
pnpm add -D @playwright/test

# Installa browser
npx playwright install
```

## 🧪 Struttura Test

```
tests/
  ├── e2e/
  │   ├── visix-embed.spec.ts     # Test integrazione WebView
  │   ├── fallback-monitor.spec.ts # Test FallbackMonitorPanel
  │   ├── fallback-audit.spec.ts   # Test FallbackAuditPanel
  │   └── fixtures/
  │       ├── mock-event-bus.ts    # Mock EventBus
  │       └── mock-strategy.ts     # Mock Strategy
  └── playwright.config.ts
```

## 📝 Esempi Test

### Test Base WebView
```typescript
import { test, expect } from '@playwright/test';

test('FallbackMonitorPanel renders in VSCode webview', async ({ page }) => {
  await page.goto('http://localhost:5173/preview/fallback-monitor');
  
  // Verifica elementi base
  await expect(page.locator('text=Fallback Monitor')).toBeVisible();
  await expect(page.locator('text=Strategia Attiva')).toBeVisible();
  
  // Verifica metriche
  await expect(page.locator('[data-testid="latency-chart"]')).toBeVisible();
  await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
});
```

### Test Interazioni
```typescript
import { test, expect } from '@playwright/test';
import { createMockEventBus } from './fixtures/mock-event-bus';

test('FallbackAuditPanel responds to events', async ({ page }) => {
  const eventBus = createMockEventBus();
  
  await page.goto('http://localhost:5173/preview/fallback-audit');
  
  // Simula evento
  await eventBus.emit('fallback:success', {
    provider: 'openai',
    latency: 450,
    timestamp: Date.now()
  });
  
  // Verifica aggiornamento UI
  await expect(page.locator('text=openai')).toBeVisible();
  await expect(page.locator('text=450ms')).toBeVisible();
});
```

## 📸 Screenshot Testing

### Configurazione
```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  expect: {
    toMatchSnapshot: { threshold: 0.2 }
  }
};

export default config;
```

### Test con Screenshot
```typescript
test('FallbackChartPanel visual regression', async ({ page }) => {
  await page.goto('http://localhost:5173/preview/fallback-chart');
  
  // Attendi rendering completo
  await page.waitForSelector('[data-testid="chart-container"]');
  
  // Verifica screenshot
  expect(await page.screenshot({
    fullPage: true
  })).toMatchSnapshot('fallback-chart.png');
});
```

## 🔄 Esecuzione Test

### Comandi
```bash
# Esegui tutti i test
pnpm test:e2e

# Esegui test specifici
pnpm test:e2e tests/e2e/visix-embed.spec.ts

# Modalità watch
pnpm test:e2e --watch

# Genera report
pnpm test:e2e --reporter=html
```

### Debug
```bash
# Modalità UI
pnpm test:e2e --ui

# Debug specifico test
pnpm test:e2e --debug
```

## 🔍 Best Practices

1. **Selettori**
   - Usa `data-testid` per elementi chiave
   - Evita selettori CSS complessi
   - Preferisci testo e ruoli ARIA

2. **Mock**
   - Isola dipendenze esterne
   - Usa fixture per dati comuni
   - Simula latenza di rete

3. **Assertions**
   - Verifica stato visibile
   - Controlla interattività
   - Valida aggiornamenti UI

4. **Screenshots**
   - Usa threshold appropriati
   - Aggiorna baseline con cautela
   - Documenta differenze attese

## 📚 Risorse

- [Playwright Docs](https://playwright.dev/docs/intro)
- [VSCode WebView Testing](https://code.visualstudio.com/api/extension-guides/webview#testing-webviews)
- [Screenshot Testing](https://playwright.dev/docs/test-snapshots)

## 🤝 Contribuire

1. Aggiungi test per nuove feature
2. Mantieni i test esistenti
3. Aggiorna screenshot baseline
4. Documenta casi edge

## 📄 Licenza

MIT 