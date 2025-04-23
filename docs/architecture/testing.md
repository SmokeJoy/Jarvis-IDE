# Testing Architecture

## Overview

Il sistema di testing di Jarvis-IDE è strutturato su più livelli per garantire la massima copertura e robustezza del codice:

1. Unit Tests
2. Integration Tests
3. End-to-End Tests
4. UI Tests (WebView)

## Unit Tests

// ... existing code ...

## Integration Tests 

// ... existing code ...

## End-to-End Tests

### API Provider Tests (`*.e2e.spec.ts`)

I test end-to-end verificano l'integrazione completa tra i vari componenti del sistema, simulando scenari reali di utilizzo.

#### JarvisAPI + Provider Tests

File: `src/api/JarvisAPI.e2e.spec.ts`

Verifica il flusso completo di:
- Configurazione provider (es. OpenAI)
- Invio messaggi
- Gestione stream di risposta
- Validazione chunks (testo/usage)
- Gestione errori
- Sequenze multiple di messaggi

**Struttura Test E2E**:
```typescript
describe('JarvisAPI E2E Tests', () => {
  let api: JarvisAPI;
  
  beforeEach(() => {
    api = new JarvisAPI();
    // Setup mocks...
  });

  it('should handle complete chat message roundtrip', async () => {
    // Test flusso completo...
  });

  it('should handle stream errors gracefully', async () => {
    // Test gestione errori...
  });
});
```

**Mock Strategy**:
- Provider API mockato ma strutturalmente identico
- Stream simulato con chunks realistici
- Errori iniettati per test robustezza
- Timing simulato per async/await

**Validazioni**:
- Formato messaggi
- Integrità stream
- Metriche usage
- Gestione errori
- Sequenze multiple

**Best Practices**:
1. Usare `beforeEach` per reset stato
2. Mockare solo lo stretto necessario
3. Mantenere struttura realistica
4. Testare edge cases
5. Validare metriche e logging

## UI Tests

// ... existing code ... 