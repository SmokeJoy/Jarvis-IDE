# Struttura Progetto - MAS con Union Dispatcher Type-Safe

## 📊 Architettura MAS Type-Safe

L'implementazione del pattern Union Dispatcher Type-Safe nel modulo Multi-Agent System (MAS) di Jarvis-IDE garantisce una comunicazione fortemente tipizzata tra il frontend React e l'estensione VS Code. Questo documento descrive l'architettura e i componenti principali.

### 🧩 Sistema di Tipi MAS

```
┌─────────────────────────────────────────────────┐
│                                                 │
│           WebviewMessageUnion (Base)            │
│                                                 │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│              MasMessageBase (Base)              │
│   type: MasMessageType | string                 │
│                                                 │
└───────────────────────┬─────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│            AgentMessageUnion (Union)            │
│   GetAgentsStatusMessage                        │
│   SendCoderInstructionMessage                   │
│   AbortCoderInstructionMessage                  │
│   ... altri tipi                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

Il sistema di tipi MAS è strutturato in tre livelli:
1. **WebviewMessageUnion** (definito in `webviewMessageUnion.ts`) - Base per tutti i messaggi WebView
2. **MasMessageBase** - Interfaccia base specifica per MAS, estende WebviewMessageUnion
3. **AgentMessageUnion** - Union discriminata di tutti i tipi di messaggi MAS specifici

### 🔒 Type Guards Pattern

```typescript
// Type guard generico
export function isMessageOfType<T extends AgentMessageUnion>(
  message: WebviewMessage<any>, 
  type: MasMessageType
): message is T {
  return message?.type === type;
}

// Type guard specifici
export function isAgentsStatusUpdateMessage(message: WebviewMessage<any>): message is AgentsStatusUpdateMessage {
  return isMessageOfType<AgentsStatusUpdateMessage>(message, MasMessageType.AGENTS_STATUS_UPDATE);
}

// Type guard principale
export function isAgentMessage(message: WebviewMessage<any>): message is AgentMessageUnion {
  return Object.values(MasMessageType).includes(message?.type as MasMessageType);
}
```

### 🔄 Flusso di Comunicazione Type-Safe

```
┌────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│                │     │                   │     │                 │
│  AgentPanel    │     │  MasCommunication │     │  VS Code        │
│  Component     │     │  Service          │     │  Extension      │
│                │     │                   │     │                 │
└───────┬────────┘     └────────┬──────────┘     └────────┬────────┘
        │                       │                         │
        │ postMessage<T>        │                         │
        │ (AgentMessageUnion)   │                         │
        │───────────────────────▶                         │
        │                       │ sendTypeSafeMessage<T>  │
        │                       │ (AgentMessageUnion)     │
        │                       │────────────────────────▶│
        │                       │                         │
        │                       │     ExtensionMessage    │
        │                       │◀────────────────────────│
        │                       │                         │
        │   if (isAgentMessage) │                         │
        │◀ - - - - - - - - - - -│                         │
        │                       │                         │
```

### 📦 Struttura dei File

```
webview-ui/
├── src/
│   ├── types/
│   │   ├── mas-types.ts           # Tipi di base per MAS
│   │   ├── mas-message.ts         # Definizioni di messaggi MAS
│   │   └── mas-message-guards.ts  # Type guard per messaggi MAS
│   │
│   ├── components/
│   │   ├── AgentPanel.tsx         # Componente MAS principale
│   │   ├── CoderAgentPrompt.tsx   # Form per invio istruzioni
│   │   └── ... altri componenti
│   │
│   └── services/
│       └── MasCommunicationService.ts # Servizio comunicazione type-safe
```

### 🧪 Implementazione nei Componenti

#### 1. MasCommunicationService

```typescript
// Implementazione Union Dispatcher
if (isAgentMessage(message)) {
  if (isAgentsStatusUpdateMessage(message)) {
    this.notifySubscribers('agentsStatusUpdate', message.payload);
  }
  else if (isTaskQueueUpdateMessage(message)) {
    this.notifySubscribers('taskQueueUpdate', message.payload);
  }
  // ... altri if
}

// Metodo type-safe per invio messaggi
private sendTypeSafeMessage<T extends AgentMessageUnion>(message: T): void {
  vscode.postMessage(message);
}
```

#### 2. AgentPanel

```typescript
// Utilizzo del hook type-safe
const { postMessage } = useExtensionMessage();

// Metodo type-safe per richiesta stato
const requestAgentsStatus = () => {
  const message: GetAgentsStatusMessage = {
    type: MasMessageType.GET_AGENTS_STATUS
  };
  postMessage<AgentMessageUnion>(message);
};

// Listener con type narrowing
const handleMessage = (event: MessageEvent) => {
  const message = event.data;
  
  if (isAgentsStatusUpdateMessage(message)) {
    setAgentsStatus(message.payload);
  }
  else if (isTaskQueueUpdateMessage(message)) {
    setTaskQueue(message.payload);
  }
};
```

#### 3. CoderAgentPrompt

```typescript
// Invio istruzione type-safe
const handleSubmit = (e: React.FormEvent) => {
  const message: SendCoderInstructionMessage = {
    type: MasMessageType.SEND_CODER_INSTRUCTION,
    payload: {
      instruction: instruction.trim(),
      style,
      priority
    }
  };
  
  postMessage<AgentMessageUnion>(message);
};
```

### ⚡ Vantaggi dell'Architettura

1. **Type-Safety Complete**: Validazione statica per tutti i messaggi MAS
2. **Runtime Validation**: Type guard per validazione a runtime aggiuntiva
3. **IDE Integration**: Supporto completo di autocompletamento e documentazione
4. **Refactoring Sicuro**: Modifica di un tipo di messaggio genera errori di compilazione in tutti i punti di utilizzo
5. **Componenti Modulari**: Componenti React e servizi TypeScript specializzati
6. **Struttura Scalabile**: Facile estensione con nuovi tipi di messaggi MAS

### 🌐 Integrazione nel Sistema

Il modulo MAS Type-Safe è perfettamente integrato con il resto di Jarvis-IDE:
- Usa la stessa infrastruttura di base degli altri componenti WebView
- Condivide lo stesso pattern Union Dispatcher degli altri moduli
- Si integra perfettamente con il bus di messaggio interno dell'estensione
- Segue le stesse convenzioni di naming e struttura degli altri file 