# Sistema di validazione dei messaggi

Questo documento descrive il sistema di validazione dei tipi per i messaggi scambiati tra l'estensione VS Code e la WebView.

## Architettura

Il sistema di validazione è organizzato su tre livelli complementari:

1. **Validazione statica via TypeScript**
   - Tipi discriminated union in `WebviewMessage.ts` e `ExtensionMessage.ts`
   - Check a tempo di compilazione

2. **Validazione runtime via type guards**
   - Funzioni in `typeGuards.ts` che validano la struttura dei messaggi
   - Verifiche strutturali semplici e veloci

3. **Validazione runtime via JSON Schema**
   - Schema JSON generati da tipi TypeScript
   - Verifica approfondita della struttura e dei valori

## Tipi di messaggio

- **WebviewMessage**: Messaggi inviati dalla WebView all'estensione
- **ExtensionMessage**: Messaggi inviati dall'estensione alla WebView
- **ChatMessage**: Singolo messaggio di chat (user, assistant, system)
- **ChatSettings**: Configurazione dei parametri di chat e completamento
- **ApiConfiguration**: Configurazione per la connessione alle API LLM

### Schemi JSON generati

| Tipo | File Schema | Descrizione |
|------|-------------|------------|
| WebviewMessage | [`WebviewMessage.schema.json`](../schemas/WebviewMessage.schema.json) | Messaggi dalla WebView all'estensione |
| ExtensionMessage | [`ExtensionMessage.schema.json`](../schemas/ExtensionMessage.schema.json) | Messaggi dall'estensione alla WebView |
| ChatMessage | [`ChatMessage.schema.json`](../schemas/ChatMessage.schema.json) | Messaggio singolo nella conversazione |
| ChatSettings | [`ChatSettings.schema.json`](../schemas/ChatSettings.schema.json) | Configurazione parametri di chat |
| ApiConfiguration | [`ApiConfiguration.schema.json`](../schemas/ApiConfiguration.schema.json) | Configurazione API LLM |

## Generazione degli schemi

Gli schemi JSON vengono generati automaticamente dai tipi TypeScript usando `ts-json-schema-generator`. Questo garantisce che gli schemi siano sempre sincronizzati con i tipi.

### Comandi disponibili

```bash
# Genera lo schema solo per WebviewMessage
npm run schema:webview

# Genera gli schemi per tutti i tipi
npm run schema:all
```

Gli schemi generati vengono salvati in `docs/schemas/`.

## Utilizzo nei componenti

### WebView

```typescript
// Con type guard
import { isExtensionMessage } from '../shared/typeGuards';

window.addEventListener('message', (event) => {
  const message = event.data;
  if (isExtensionMessage(message)) {
    // Messaggio valido
  }
});

// Con validazione schema (più dettagliata)
import { isValidExtensionMessage, getExtensionMessageErrors } from '../shared/validators';

window.addEventListener('message', (event) => {
  const message = event.data;
  if (!isValidExtensionMessage(message)) {
    const errors = getExtensionMessageErrors(message);
    console.error('Errori di validazione:', errors);
    return;
  }
  // Messaggio valido
});
```

### Estensione

```typescript
// Con validatore con assertion
import { validateWebviewMessageOrThrow } from '../shared/validators';

try {
  validateWebviewMessageOrThrow(someMessage);
  // Messaggio valido
} catch (error) {
  console.error('Messaggio non valido:', error.message);
}
```

## Utilizzo con i payload

### Validazione di un ChatMessage

```typescript
import { isValidChatMessage, validateChatMessageOrThrow } from '../shared/validators';

// Verifica semplice
if (isValidChatMessage(someMessage)) {
  // Valido
}

// Verifica con dettagli errore
try {
  validateChatMessageOrThrow(someMessage);
  // Message è valido
} catch (error) {
  console.error('Errore di validazione:', error.message);
}
```

### Validazione di array di messaggi

```typescript
import { isValidChatMessageArray, validateChatMessageArrayOrThrow } from '../shared/validators';

// Verifica un array di messaggi
if (isValidChatMessageArray(chatHistory)) {
  // Array valido
}

// Con eccezione dettagliata 
try {
  validateChatMessageArrayOrThrow(chatHistory);
  // Array è valido
} catch (error) {
  console.error('Errore di validazione array:', error.message);
}
```

### Validazione delle impostazioni

```typescript
import { isValidChatSettings, getChatSettingsErrors } from '../shared/validators';

// Verifica con dettagli errore
if (!isValidChatSettings(settings)) {
  const errors = getChatSettingsErrors(settings);
  console.error('Errori nelle impostazioni chat:', errors);
}
```

### Validazione configurazione API

```typescript
import { validateApiConfigurationOrThrow } from '../shared/validators';

// Esempio con try/catch
try {
  validateApiConfigurationOrThrow(apiConfig);
  // Configurazione valida, procedi con l'inizializzazione
  initializeApi(apiConfig);
} catch (error) {
  console.error('Configurazione API non valida:', error.message);
  // Mostra errore all'utente o usa configurazione di fallback
}
```

## Supporto DeepSeek

Gli esempi di messaggio per DeepSeek sono disponibili in `docs/examples/deepseek/`:

- `webview-message-examples.json`: Esempi di WebviewMessage
- `extension-message-examples.json`: Esempi di ExtensionMessage
- `chat-message-examples.json`: Esempi di ChatMessage
- `chat-settings-examples.json`: Esempi di ChatSettings
- `api-configuration-examples.json`: Esempi di ApiConfiguration

Questi file includono esempi per tutti i tipi di messaggio con descrizioni dettagliate.

## Fallback

Il sistema è progettato per funzionare anche quando gli schemi JSON non sono disponibili:

1. Se gli schemi non possono essere caricati, il validatore utilizza i type guards
2. Se AJV non può essere inizializzato, vengono utilizzati i type guards

## Vantaggi

- **Coerenza**: Validazione uniforme in tutta l'applicazione
- **Robustezza**: Errori rilevati prima che causino problemi
- **Flessibilità**: Diversi livelli di validazione per diverse esigenze
- **Estensibilità**: Facile aggiungere nuovi tipi di messaggio
- **Documentazione**: Schema e esempi utili per sviluppatori esterni 