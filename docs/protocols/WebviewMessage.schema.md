# Schema WebviewMessage

Questo documento descrive tutte le varianti del tipo discriminato `WebviewMessage` utilizzato per la comunicazione tra la WebView e l'estensione VS Code.

## Struttura generale

Ogni `WebviewMessage` segue questa struttura di base:

```typescript
{
  type: string;   // Discriminator che identifica il tipo di messaggio
  payload?: any;  // Dati specifici del tipo di messaggio, opzionali
}
```

## Tipi di messaggio

### `getSettings`

Richiede le impostazioni correnti dell'estensione.

```json
{
  "type": "getSettings"
}
```

### `saveSettings`

Salva le nuove impostazioni dell'estensione.

```json
{
  "type": "saveSettings",
  "payload": {
    "apiKey": "sk-*****",
    "modelId": "gpt-4",
    "maxTokens": 2048,
    "temperature": 0.7,
    "systemPrompt": "You are a helpful assistant."
  }
}
```

### `chatRequest`

Invia una richiesta di chat al modello.

```json
{
  "type": "chatRequest",
  "payload": {
    "prompt": "Come funziona la ricorsione?",
    "messageId": "msg_123456",
    "contextFiles": ["/path/to/file.ts"],
    "systemPrompt": "Sei un assistente di programmazione esperto di TypeScript."
  }
}
```

### `cancelRequest`

Annulla una richiesta in corso.

```json
{
  "type": "cancelRequest"
}
```

### `clearChat`

Cancella la cronologia della chat corrente.

```json
{
  "type": "clearChat"
}
```

### `resetApiKey`

Richiede il reset della chiave API.

```json
{
  "type": "resetApiKey"
}
```

### `exportChat`

Richiede l'esportazione della chat corrente.

```json
{
  "type": "exportChat",
  "payload": {
    "format": "markdown"
  }
}
```

### `executeCommand`

Esegue un comando di VS Code.

```json
{
  "type": "executeCommand",
  "payload": {
    "command": "workbench.action.files.save",
    "args": ["/path/to/file.ts"]
  }
}
```

### `selectFiles`

Richiede la selezione di file per il contesto.

```json
{
  "type": "selectFiles"
}
```

### `loadContext`

Carica il contesto specifico per un file o directory.

```json
{
  "type": "loadContext",
  "payload": {
    "path": "/path/to/directory",
    "recursive": true
  }
}
```

### `modelSwitch`

Richiede il cambio del modello AI attivo.

```json
{
  "type": "modelSwitch",
  "payload": {
    "modelId": "gpt-3.5-turbo"
  }
}
```

### `progressUpdate` 

Imposta lo stato di avanzamento di un'operazione.

```json
{
  "type": "progressUpdate",
  "payload": {
    "id": "task_123",
    "progress": 0.75,
    "message": "Elaborazione in corso..."
  }
}
```

### `searchDocs` *(deprecated)*

Cerca nella documentazione. Deprecato in favore di `executeCommand` con comando specifico.

```json
{
  "type": "searchDocs",
  "payload": {
    "query": "useState React"
  }
}
```

## Note implementative

- Tutti i messaggi sono validati tramite type guards in `shared/typeGuards.ts`
- Utilizzare `isWebviewMessage()` per verificare che un oggetto sia un messaggio valido
- Per una validazione rigorosa, utilizzare `safeCastAs<WebviewMessage>()` o `requireWebviewMessage()`
- Le comunicazioni WebView → Extension utilizzano `WebviewMessage`
- Le comunicazioni Extension → WebView utilizzano `ExtensionMessage` 

## Utilizzo sicuro

```typescript
// Invio di un messaggio con validazione di tipo
const message = {
  type: "chatRequest",
  payload: { prompt: "Hello" }
};

// Sicuro - lancia errore se il formato è errato
vscode.postMessage(safeCastAs<WebviewMessage>(message));

// Alternativa con strictGuard
vscode.postMessage(requireWebviewMessage(message));

// Verifica dei messaggi in entrata
window.addEventListener('message', (event) => {
  if (isExtensionMessage(event.data)) {
    // Gestisci il messaggio
  } else {
    console.error('Messaggio non valido');
  }
});
``` 