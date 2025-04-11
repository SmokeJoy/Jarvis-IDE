# Struttura Progetto Post-Refactor Union Dispatcher

## 📐 Pattern Architetturali

### 🧩 Union Dispatcher Type-Safe

Il progetto ora implementa un pattern di gestione messaggi basato su unioni discriminate TypeScript, che garantisce sicurezza di tipo e resilienza nella comunicazione tra componenti.

```
┌─────────────────┐         ┌──────────────────────┐
│                 │         │                      │
│    WebView UI   │─────────▶  WebviewMessage<T>   │
│                 │         │  (Union Discriminata) │
└─────────────────┘         └──────────┬───────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────┐
│                                                    │
│            BaseWebviewMessageHandler               │
│                                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │  dispatchMessage(msg: WebviewMessageUnion)  │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
└───────────────────────┬────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
┌─────────▼──────────┐     ┌──────────▼─────────┐
│                    │     │                     │
│ TaskQueueHandler   │     │  Altri Handler      │
│                    │     │                     │
└────────────────────┘     └─────────────────────┘
```

### 🔍 Struttura dei Tipi

Il sistema di tipi è stato ristrutturato per utilizzare unioni discriminate anziché `any` o type assertion:

```typescript
// Pattern Union Discriminata (prima/dopo)

// ❌ PRIMA
handleMessage(message: any): void {
  switch(message.type) {
    case 'action': // Nessun controllo di tipo
      this.handleAction(message as ActionMessage);
      break;
  }
}

// ✅ DOPO
handleMessage(message: WebviewMessage): void {
  this.dispatchMessage(message as WebviewMessageUnion);
}

protected dispatchMessage(message: WebviewMessageUnion): void {
  if (isTaskQueueMessage(message)) {
    switch(message.type) {
      case TaskQueueMessageType.ADD_TASK:
        // Qui TypeScript sa che message è di tipo TaskQueueAddTaskMessage
        this._handleAddTask(message); // Type-safe!
        break;
    }
  }
}

// Uso di Extract<T> per type-safety
protected handleError(
  errorMessage: Extract<WebviewMessageUnion, { type: typeof WebviewMessageType.ERROR }>
): void {
  // Accesso sicuro alle proprietà del tipo specifico
}
```

## 📁 Organizzazione dei File

```
src/
├── webview/
│   ├── handlers/
│   │   ├── WebviewMessageHandler.ts    // Base astratta con dispatcher
│   │   ├── TaskQueueMessageHandler.ts  // Implementazione specifica
│   │   └── ...
│   └── ...
├── shared/
│   ├── types/
│   │   ├── webview.types.ts            // Definizioni interfacce base
│   │   ├── webviewMessageUnion.ts      // Union types + type guards
│   │   └── ...
│   └── ...
└── ...
```

## 🔄 Flusso di Lavoro

1. L'interfaccia utente genera un `WebviewMessage<T>` fortemente tipizzato
2. Il messaggio arriva al `WebviewMessageHandler` di base
3. Il gestore base invoca `dispatchMessage()` con il messaggio come `WebviewMessageUnion`
4. L'implementazione specifica dell'handler discrimina in base al campo `type`
5. TypeScript garantisce che tutti i casi siano gestiti e che l'accesso ai campi sia type-safe

## 📊 Metriche di Qualità

- 🧪 **Test Coverage**: ≥90% mantenuto su tutti i componenti
- 🔒 **Sicurezza di Tipo**: Eliminati tutti gli `any` e `as` non verificati
- 🧠 **Cognitive Complexity**: Ridotta attraverso pattern dispatcher

## 🔄 Evoluzione Futura

Il pattern è progettato per:

1. Facilitare l'aggiunta di nuovi tipi di messaggi
2. Migliorare il refactoring con controlli statici
3. Permettere funzionalità di analisi e logging centralizzate
4. Supportare nuovi handler specializzati 