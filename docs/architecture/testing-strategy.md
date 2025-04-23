# Testing Strategy

## End-to-End Testing

### JarvisAPI E2E Tests

Il modulo JarvisAPI include una suite completa di test end-to-end che validano l'integrazione con i provider LLM e il corretto funzionamento del sistema di messaggistica.

#### Test Coverage

- **Chat Message Flow**: Validazione del flusso completo di messaggi, dalla richiesta alla risposta
- **Error Handling**: Test della gestione degli errori di stream e di provider
- **Message Sequences**: Verifica della gestione di sequenze multiple di messaggi
- **Provider Configuration**: Validazione delle configurazioni per diversi provider
- **Usage Metrics**: Test del tracciamento delle metriche di utilizzo
- **Provider-Specific Features**: Test delle funzionalità specifiche per provider
- **Rate Limiting**: Verifica della gestione del rate limiting e della concorrenza

#### Implementation Details

```typescript
// Example test structure
describe('JarvisAPI E2E Tests', () => {
  test('complete chat message roundtrip', async () => {
    // Setup provider mock
    // Configure API
    // Send message
    // Validate response
  });
  
  test('handle stream errors gracefully', async () => {
    // Setup error conditions
    // Verify error handling
  });
  
  // Additional test cases...
});
```

#### Best Practices

1. **Mocking**: Utilizzo di mock per simulare risposte dei provider
2. **Assertions**: Validazione completa di input/output
3. **Error Cases**: Test espliciti per scenari di errore
4. **Concurrency**: Test di scenari con multiple richieste
5. **Configuration**: Validazione di tutte le opzioni di configurazione

#### Maintenance

- Aggiornamento regolare per nuovi provider
- Estensione per nuove funzionalità
- Monitoraggio della copertura
- Documentazione degli scenari di test 

### Provider-Specific Tests

#### AnthropicHandler Tests

Il modulo AnthropicHandler include una suite completa di test unitari che validano l'integrazione con l'API Claude di Anthropic.

##### Test Coverage

- **Message Mapping**: Validazione della corretta mappatura dei messaggi nel formato Anthropic
- **Chat Completion**: Test delle risposte complete non-streaming
- **Streaming**: Verifica della gestione dei chunk in modalità streaming
- **Token Usage**: Validazione delle statistiche di utilizzo token
- **Error Handling**: Test della gestione degli errori e fallback

##### Implementation Details

```typescript
// Example test structure
describe('AnthropicHandler Tests', () => {
  test('mapMessages correctly formats messages', () => {
    // Verifica mappatura messaggi
  });
  
  test('chat returns complete response', () => {
    // Test risposta completa
  });
  
  test('chatStream yields correct chunks', () => {
    // Verifica streaming chunks
  });
});
```

##### Best Practices

1. **Mocking**: 
   - Mock completo del SDK Anthropic
   - Simulazione accurata del formato Claude 3
   - Gestione separata streaming/non-streaming

2. **Assertions**:
   - Validazione struttura messaggi
   - Verifica token statistics
   - Test integrità stream

3. **Error Cases**:
   - Test errori API
   - Validazione fallback
   - Gestione timeout

4. **Maintenance**:
   - Aggiornamento per nuove versioni Claude
   - Estensione per nuove funzionalità
   - Monitoraggio coverage 