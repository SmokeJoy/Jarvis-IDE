# Strumenti di validazione payload

Questo documento descrive gli strumenti di validazione disponibili per verificare la conformità dei payload JSON ai tipi definiti nel sistema.

## CLI di validazione

Lo script `test-payloads.ts` permette di validare rapidamente file JSON contro i tipi supportati dal sistema.

### Utilizzo

```bash
pnpm run test:payload --file=path/to/file.json --type=TipoDesiderato
```

### Tipi supportati

- `ChatMessage`: Singolo messaggio di chat
- `ChatMessage[]`: Array di messaggi di chat
- `ChatSettings`: Configurazione dei parametri di chat
- `ApiConfiguration`: Configurazione per la connessione alle API

### Esempi

```bash
# Validare un esempio di ChatMessage
pnpm run test:payload --file=docs/examples/deepseek/chat-message-examples.json --type=ChatMessage

# Validare un array di ChatMessage
pnpm run test:payload --file=docs/examples/deepseek/chat-message-examples.json --type=ChatMessage[]

# Validare impostazioni di chat
pnpm run test:payload --file=docs/examples/deepseek/chat-settings-examples.json --type=ChatSettings

# Validare configurazione API
pnpm run test:payload --file=docs/examples/deepseek/api-configuration-examples.json --type=ApiConfiguration
```

### Output

Lo script fornisce output dettagliati:

- ✅ Visualizza un messaggio di successo quando il payload è valido
- ❌ Mostra errori dettagliati quando il payload non è conforme
- ⚠️ Indica quando il fallback è stato utilizzato (schema non disponibile)

## Integrazione DeepSeek

È disponibile un prompt DeepSeek per testare automaticamente i payload:

```json
{
  "instruction": "Testa questi payload usando la validazione runtime basata su JSON Schema. Verifica che ogni esempio sia conforme al tipo corretto e restituisca zero errori. Se uno schema non è disponibile, applica fallback con type guard.",
  "context": {
    "schemas": [
      "docs/schemas/ChatMessage.schema.json",
      "docs/schemas/ChatSettings.schema.json",
      "docs/schemas/ApiConfiguration.schema.json"
    ],
    "validators": [
      "src/shared/validators.ts"
    ],
    "examples": [
      "docs/examples/deepseek/chat-message-examples.json",
      "docs/examples/deepseek/chat-settings-examples.json",
      "docs/examples/deepseek/api-configuration-examples.json"
    ]
  },
  "tasks": [
    {
      "type": "schema-validation",
      "targetSchema": "ChatMessage",
      "examplesFile": "chat-message-examples.json",
      "validatorFunction": "isValidChatMessage",
      "strict": true,
      "fallbackAllowed": true
    },
    {
      "type": "schema-validation",
      "targetSchema": "ChatSettings",
      "examplesFile": "chat-settings-examples.json",
      "validatorFunction": "isValidChatSettings",
      "strict": true,
      "fallbackAllowed": true
    },
    {
      "type": "schema-validation",
      "targetSchema": "ApiConfiguration",
      "examplesFile": "api-configuration-examples.json",
      "validatorFunction": "isValidApiConfiguration",
      "strict": true,
      "fallbackAllowed": true
    }
  ]
}
```

## Generazione schemi

Gli schemi JSON vengono generati dai tipi TypeScript:

```bash
# Genera lo schema per WebviewMessage
pnpm run schema:webview

# Genera schema per tutti i tipi
pnpm run schema:all
```

Gli schemi generati si trovano in `docs/schemas/`.

## Validatori disponibili

I validatori disponibili in `src/shared/validators.ts` includono:

### Funzioni di validazione

| Funzione | Tipo | Descrizione |
|----------|------|-------------|
| `isValidChatMessage` | `ChatMessage` | Verifica se un oggetto è un messaggio di chat valido |
| `isValidChatMessageArray` | `ChatMessage[]` | Verifica se un array contiene messaggi di chat validi |
| `isValidChatSettings` | `ChatSettings` | Verifica se un oggetto è una configurazione di chat valida |
| `isValidApiConfiguration` | `ApiConfiguration` | Verifica se un oggetto è una configurazione API valida |

### Funzioni di errore

| Funzione | Tipo | Descrizione |
|----------|------|-------------|
| `getChatMessageErrors` | `ChatMessage` | Ottiene gli errori di validazione per un messaggio |
| `getChatMessageArrayErrors` | `ChatMessage[]` | Ottiene gli errori di validazione per un array di messaggi |
| `getChatSettingsErrors` | `ChatSettings` | Ottiene gli errori di validazione per impostazioni chat |
| `getApiConfigurationErrors` | `ApiConfiguration` | Ottiene gli errori di validazione per configurazione API |

### Validatori con eccezione

| Funzione | Tipo | Descrizione |
|----------|------|-------------|
| `validateChatMessageOrThrow` | `ChatMessage` | Lancia eccezione se il messaggio non è valido |
| `validateChatMessageArrayOrThrow` | `ChatMessage[]` | Lancia eccezione se l'array di messaggi non è valido |
| `validateChatSettingsOrThrow` | `ChatSettings` | Lancia eccezione se le impostazioni non sono valide |
| `validateApiConfigurationOrThrow` | `ApiConfiguration` | Lancia eccezione se la configurazione API non è valida |

## Meccanismo di fallback

Tutti i validatori includono un meccanismo di fallback automatico che si attiva quando gli schemi JSON non sono disponibili. Questo garantisce che la validazione funzioni sempre, anche in ambienti dove gli schemi non possono essere caricati. 