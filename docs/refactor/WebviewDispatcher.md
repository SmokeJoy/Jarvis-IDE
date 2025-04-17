# WebviewDispatcher – Refactor F3

## Scopo
Dispatcher centralizzato e type-safe per la gestione dei messaggi discriminati tra Webview e Extension/MAS.

---

## API

### `registerHandler`
Registra un handler per uno specifico tipo di messaggio.

```ts
registerHandler('chatRequest', (msg) => {
  handleChat(msg.payload);
});
```

**Tipo:**
```ts
function registerHandler<T extends WebviewMessageUnion['type']>(
  type: T,
  handler: (message: Extract<WebviewMessageUnion, { type: T }>) => void
): void
```

---

### `handleIncomingMessage`
Invoca l'handler registrato per il tipo di messaggio ricevuto.

```ts
handleIncomingMessage(message);
```

**Tipo:**
```ts
function handleIncomingMessage(message: WebviewMessageUnion): void
```

---

## Tipi

- `WebviewMessageUnion`: unione discriminata di tutti i messaggi gestiti dal sistema (importata da `@shared/messages`).
- `Handler<T>`: funzione che riceve un messaggio tipizzato.

---

## Esempi

### 1. chatRequest
```ts
registerHandler('chatRequest', (msg) => {
  handleChat(msg.payload);
});
```

### 2. cancelRequest
```ts
registerHandler('cancelRequest', (msg) => {
  cancelChat(msg.payload.id);
});
```

### 3. exportChat
```ts
registerHandler('exportChat', (msg) => {
  exportChatToFile(msg.payload.chatId);
});
```

---

## Note
- Se non esiste un handler per il tipo di messaggio, viene loggato un warning.
- Tutti i tipi sono inferiti e type-safe: nessun uso di `any`.
- La centralizzazione permette testabilità e refactor futuri (es. mock dispatcher nei test).

---

## Stato
- **F3 completata**: dispatcher pronto per essere integrato in MAS, WebSocketBridge, e testato. 