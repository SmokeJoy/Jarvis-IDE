# Struttura Progetto - Hooks e Componenti React Union Dispatcher

## 📊 Architettura Frontend Type-Safe 

### 🧩 Hooks Webview

L'architettura del frontend è stata aggiornata per utilizzare il pattern Union Dispatcher Type-Safe a livello di hook React, garantendo una comunicazione fortemente tipizzata tra i componenti React e l'estensione VS Code.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                  React Component                │
│                                                 │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│              useExtensionMessage                │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  postMessage<T extends WebviewMessage>  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│                VS Code Webview API              │
│                                                 │
└─────────────────────────────────────────────────┘
```

Il hook `useExtensionMessage` ora fornisce:

- `postMessage<T>` - Metodo type-safe che accetta solo tipi di messaggi validi
- `sendMessageByType` - Helper per casi d'uso semplici che richiede solo tipo e payload

Implementazione chiave:

```typescript
const postMessage = useCallback(<T extends WebviewMessageUnion>(message: T) => {
  vscode.postMessage(message);
}, []);
```

Questo pattern garantisce che tutti i messaggi inviati dall'interfaccia utente all'estensione VS Code siano correttamente tipizzati e validati dal sistema di tipi di TypeScript.

### 🔍 Componenti React con Union Dispatcher

I componenti React che comunicano con l'estensione VS Code sono stati aggiornati per utilizzare il pattern Union Dispatcher con Type Guards:

```
┌─────────────────────────────┐     ┌─────────────────────┐
│                             │     │                     │
│      Componente React       │     │  WebviewMessageType │
│                             │     │                     │
└──────────────┬──────────────┘     └─────────────────────┘
               │                                ▲
               │                                │
               ▼                                │
┌─────────────────────────────┐     ┌─────────────────────┐
│                             │     │                     │
│  Interface MessageSpecifico ◄─────┤  WebviewMessage<T>  │
│  extends WebviewMessageUnion│     │                     │
└──────────────┬──────────────┘     └─────────────────────┘
               │
               │
               ▼
┌─────────────────────────────┐
│                             │
│  isMessageSpecifico(): true │
│  Type Guard                 │
│                             │
└──────────────┬──────────────┘
               │
               │
               ▼
┌─────────────────────────────┐
│                             │
│  useExtensionMessage()      │
│  postMessage<T>(message)    │
│                             │
└─────────────────────────────┘
```

Il pattern implementato nei componenti:

1. **Definizione del messaggio**: Ogni componente definisce interfacce specifiche estendendo `WebviewMessageUnion`
2. **Type Guard**: Per ogni tipo di messaggio, un type guard verifica a runtime il tipo
3. **Hook Type-Safe**: Utilizzo dell'hook `useExtensionMessage` per inviare messaggi

Esempio implementativo in `PromptEditor.tsx`:

```typescript
// Definizione del messaggio
interface InfoMessage extends WebviewMessageUnion {
  type: 'info';
  payload: { message: string; severity: string };
}

// Type guard
function isInfoMessage(message: WebviewMessageUnion): message is InfoMessage {
  return message.type === 'info' && 
    typeof message.payload === 'object' && 
    message.payload !== null &&
    'message' in message.payload;
}

// Utilizzo nel componente
const { postMessage } = useExtensionMessage();
postMessage<InfoMessage>({
  type: 'info',
  payload: { message: 'Aggiornato', severity: 'info' }
});
```

## 🔄 Flusso di Comunicazione

Il flusso di comunicazione tra i componenti React e l'estensione VS Code è ora completamente type-safe:

1. Il componente React crea un messaggio specifico fortemente tipizzato
2. Il type guard può verificare il tipo del messaggio a runtime
3. L'hook `useExtensionMessage` accetta solo messaggi validi
4. L'estensione VS Code riceve il messaggio e può usare type guard per verifica

Questo approccio elimina un'intera classe di errori comuni nella comunicazione tra frontend e backend, garantendo che i cambiamenti nella struttura dei messaggi vengano rilevati immediatamente durante la fase di compilazione. 