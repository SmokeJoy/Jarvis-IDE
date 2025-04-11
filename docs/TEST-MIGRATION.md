# Migrazione dei Test da Jest a Vitest

## Panoramica

Questo documento descrive il processo di migrazione dei test da Jest a Vitest e le soluzioni adottate per risolvere i problemi riscontrati.

## Problemi identificati

1. **Errori di importazione nei file di test**:
   - Test in `webview-ui/src/__tests__/llm-orchestrator.multi.test.ts` cercavano di importare moduli dalla directory principale `../../src/providers/...`
   - I percorsi di importazione non erano compatibili con la struttura di directory di webview-ui

2. **Errori nel mock di vscode**:
   - Il modulo 'vscode' non è un pacchetto npm ma un'API globale disponibile solo durante l'esecuzione dell'estensione
   - Il mock esistente causava errori di sintassi

3. **Incompatibilità tra Jest e Vitest**:
   - I test erano scritti per Jest (`jest.mock`, `jest.fn`, ecc.) ma dovevano essere eseguiti con Vitest
   - Le funzioni di Jest dovevano essere sostituite con le equivalenti di Vitest (`vi.mock`, `vi.fn`, ecc.)

4. **Problemi nei test dei componenti React**:
   - Gli event listener per i messaggi non venivano registrati correttamente
   - Problemi con il timing e l'asincronicità nei test

## Soluzioni implementate

### 1. Setup di Vitest

Creato un file di setup completo in `webview-ui/tests/setup.ts` che include:
- Mock globale per VSCode
- Mock per l'API VSCode dell'extension
- Configurazione dei timer falsi per i test
- Mock per i messaggi della webview
- Pulizia automatica dopo ogni test

### 2. Mock per VSCode

Creato un mock completo per VSCode in `webview-ui/tests/mocks/vscode.ts` che implementa:
- OutputChannel
- Window, Workspace, Commands, Uri
- Event e altre funzionalità necessarie

### 3. Mock per l'orchestratore LLM

Creati mock per:
- Provider Registry in `webview-ui/tests/mocks/provider-registry.ts`
- LLM Orchestrator in `webview-ui/tests/mocks/llm-orchestrator.ts`

### 4. Conversione automatica Jest → Vitest

Creato uno script in `scripts/jest-to-vitest.js` che automatizza la conversione di:
- Funzioni Jest (`jest.fn()` → `vi.fn()`)
- Import e API
- Matchers e altre funzionalità

### 5. Risoluzione dei problemi nei test di componenti React

Aggiornato `RetryPanel.test.tsx` per:
- Utilizzare un mock corretto per `window.addEventListener` e `window.removeEventListener`
- Implementare una funzione `sendMessage` per simulare messaggi
- Utilizzare `vi.advanceTimersByTime()` per gestire l'asincronicità

## Configurazione aggiornata di Vitest

```js
// webview-ui/vitest.config.ts
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    deps: {
      inline: [
        /vscode/,
        /src\/providers/
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src'),
      'test-utils': path.resolve(__dirname, './src/__tests__/utils'),
      '@shared': path.resolve(__dirname, '../src'),
      'vscode': path.resolve(__dirname, './tests/mocks/vscode.ts')
    }
  }
});
```

## Utilizzo dello script di conversione

```bash
# Converti tutti i test in una directory
node scripts/jest-to-vitest.js src/__tests__

# Converti un singolo file di test
node scripts/jest-to-vitest.js src/__tests__/components/RetryPanel.test.tsx
```

## Test ancora da migrare

- `provider-registry.test.ts`: utilizza ancora la sintassi Jest, da convertire
- `AgentPanel.test.tsx`: necessita di implementazione con Vitest
- `MASMemoryPanel.test.tsx`: corregge i test esistenti

## Prossimi passi

1. Completare la conversione di tutti i test usando lo script
2. Aggiornare le configurazioni di test di TypeScript
3. Integrare i test nella pipeline CI/CD
4. Creare test E2E per l'orchestratore MAS 