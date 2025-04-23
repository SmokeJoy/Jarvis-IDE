# JarvisAPI

La classe `JarvisAPI` è il punto di ingresso principale per interagire con i modelli LLM in Jarvis-IDE. Implementa il pattern Singleton per garantire una singola istanza condivisa.

## Configurazione

La configurazione dell'API viene gestita attraverso l'interfaccia `APIConfiguration` che include:

- `provider`: Il provider LLM (OpenAI, Anthropic, Google, Local)
- `apiKey`: La chiave API per il provider
- `modelId`: L'ID del modello da utilizzare
- `temperature`: Temperatura per la generazione (0-1)
- `maxTokens`: Numero massimo di token per la risposta

## Metodi

### getInstance()

Ottiene l'istanza singleton di JarvisAPI.

```typescript
public static getInstance(): JarvisAPI
```

### setConfiguration(config)

Imposta la configurazione dell'API.

```typescript
public async setConfiguration(config: Partial<APIConfiguration>): Promise<APIResponse<void>>
```

### getConfiguration()

Ottiene la configurazione corrente dell'API.

```typescript
public async getConfiguration(): Promise<APIResponse<APIConfiguration>>
```

### loadModels(apiKey?)

Carica i modelli disponibili per il provider configurato.

```typescript
public async loadModels(apiKey?: string): Promise<APIResponse<ModelInfo[]>>
```

### sendMessage(message, modelId?, apiKey?)

Invia un messaggio al modello selezionato.

```typescript
public async sendMessage(message: string, modelId?: string, apiKey?: string): Promise<APIResponse<string>>
```

### reset()

Resetta la configurazione dell'API ai valori predefiniti.

```typescript
public async reset(): Promise<APIResponse<void>>
```

## Gestione degli errori

Tutti i metodi restituiscono un oggetto `APIResponse` che include:

- `success`: Boolean che indica se l'operazione è riuscita
- `data`: I dati restituiti (se l'operazione è riuscita)
- `error`: Messaggio di errore (se l'operazione è fallita)

## Esempio di utilizzo

```typescript
// Ottieni l'istanza
const api = JarvisAPI.getInstance();

// Configura l'API
await api.setConfiguration({
  provider: LLMProviderId.OpenAI,
  apiKey: 'your-api-key',
  modelId: 'gpt-4'
});

// Invia un messaggio
const response = await api.sendMessage('Hello, AI!');
if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error);
}
```

## Test

La classe include un set completo di test unitari in `JarvisAPI.spec.ts` che coprono:

- Gestione dell'istanza singleton
- Configurazione dell'API
- Caricamento dei modelli
- Invio dei messaggi
- Reset della configurazione
- Gestione degli errori

I test possono essere eseguiti con:

```bash
pnpm test
```

## Test End-to-End

Il modulo JarvisAPI include una suite completa di test end-to-end implementati con Vitest. I test sono progettati per validare il comportamento dell'API in scenari reali di utilizzo.

### Struttura dei Test

```typescript
describe('JarvisAPI E2E Tests', () => {
  // Setup e teardown
  beforeEach(() => { /* ... */ })
  afterEach(() => { /* ... */ })

  // Test cases
  test('handles complete chat message roundtrip')
  test('handles stream errors gracefully') 
  test('processes multiple message sequences')
  test('validates provider configuration')
  test('tracks usage metrics correctly')
})
```

### Scenari Testati

1. **Chat Message Roundtrip**
   - Verifica il flusso completo di un messaggio
   - Valida la configurazione del provider
   - Controlla la correttezza dei chunk ricevuti
   - Monitora le chiamate al provider

2. **Gestione Errori**
   - Test degli errori durante lo streaming
   - Verifica della propagazione degli errori
   - Controllo della resilienza del sistema

3. **Messaggi Multipli**
   - Validazione sequenze di messaggi
   - Verifica consistenza delle risposte
   - Test delle chiamate multiple al provider

4. **Configurazione Provider**
   - Test delle configurazioni invalide
   - Verifica della gestione errori
   - Validazione parametri di configurazione

5. **Metriche e Telemetria**
   - Test del conteggio token
   - Verifica metriche di utilizzo
   - Validazione chunk di telemetria

### Mock Provider

```typescript
const mockProvider = {
  sendMessage: vi.fn().mockImplementation(async function* () {
    yield { type: 'text', content: 'Test response' }
    yield { type: 'usage', tokens: { total: 10, completion: 5, prompt: 5 } }
  })
}
```

### Asserzioni Principali

```typescript
// Verifica risposta
expect(response).toEqual({
  type: 'text',
  content: expect.any(String)
})

// Controllo metriche
expect(metrics).toEqual({
  tokens: {
    total: expect.any(Number),
    completion: expect.any(Number),
    prompt: expect.any(Number)
  }
})

// Validazione errori
expect(() => api.configure(invalidConfig)).toThrow()
```

### Coverage

La suite di test E2E mira a una copertura del 90%+ per il modulo JarvisAPI, includendo:
- Flussi di messaggi completi
- Gestione errori
- Configurazione provider
- Metriche e telemetria

### Estensioni Future

- Test per provider aggiuntivi (Claude, Gemini)
- Scenari di recovery e resilienza
- Metriche avanzate e telemetria estesa 