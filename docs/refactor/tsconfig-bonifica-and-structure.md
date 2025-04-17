# 🛠️ Refactor TypeScript F1–F5 & Validazione con `tsconfig.bonifica`

## 📋 Sommario

Questa documentazione riassume le modifiche architetturali e di tipizzazione TypeScript apportate dalla Fase 1 alla Fase 5 del refactor Jarvis-IDE, e spiega l'uso strategico di `pnpm tsc --noEmit -p tsconfig.bonifica.json` come validatore ufficiale del refactor.

---

## 🚦 Fasi del Refactor (F1–F5)

### **F1–F2: Analisi e Formalizzazione Eventi**
- Formalizzazione di tutti gli eventi MAS e LLM in file dedicati (`MAS_EVENTS.md`, `deep-analysis.md`)
- Definizione di unione discriminata per i messaggi

### **F3: Dispatcher Tipizzato**
- Creazione di `WebviewDispatcher.ts`:
  - Dispatcher centralizzato e type-safe
  - Handler registrati per ogni tipo di messaggio
  - Eliminazione di switch/case legacy

```ts
import { WebviewMessageUnion } from '@shared/messages';

export function registerHandler<T extends WebviewMessageUnion['type']>(
  type: T,
  handler: (message: Extract<WebviewMessageUnion, { type: T }>) => void
) { /* ... */ }

export function handleIncomingMessage<T extends WebviewMessageUnion['type']>(
  msg: Extract<WebviewMessageUnion, { type: T }>
): void { /* ... */ }
```

### **F4: Unificazione Messaggi WebSocket/MAS**
- Creazione di `websocketMessageUnion.ts` in `@shared/types`
- Barrelizzazione in `@shared/messages`
- Eliminazione duplicati e refactor di tutti i consumer

```ts
export type DisconnectMessage = BaseMessage<'websocket/disconnect'>;
export type LlmCancelMessage = BaseMessage<'LLM_CANCEL', { requestId: string }>;
```

### **F5: Test, Type Guards, Factory e Validazione**
- Test unitari e snapshot per hook e componenti core
- Factory tipizzate per messaggi di test (`test/__factories__/messages.ts`)
- Type guards generici per ogni famiglia di messaggi
- Validazione costante con:

```bash
pnpm tsc --noEmit -p tsconfig.bonifica.json
```

- Nessun `as any` nei test o nel core
- Tutti i messaggi e i payload sono ora type-safe e validati

---

## 🧪 Validazione con `tsconfig.bonifica`

- Il comando:

```bash
pnpm tsc --noEmit -p tsconfig.bonifica.json
```

- Garantisce che **tutto il refactor** sia type-safe, senza errori di discriminated union, handler, o barrel.
- Usato come _validator ufficiale_ prima di ogni merge o rilascio.

---

## 📦 Esempio di Factory Tipizzata

```ts
export function createFakeResponseMessage(): ResponseMessage {
  return {
    type: 'RESPONSE',
    payload: {
      agentId: 'dev-agent',
      text: 'Mocked message',
      timestamp: Date.now(),
    },
  };
}
```

---

## 🚀 Prossimi Passi

- Fase 6: PromptEngine Refactor
- Consolidare `PromptRunMode`, `PromptStrategy`, fallback `'chat' | 'coder'`
- Validare MAS-flow anche per strategie asincrone 