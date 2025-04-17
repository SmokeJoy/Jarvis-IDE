# 📡 MAS_EVENTS.md — Registro Eventi MAS

> Elenco completo degli eventi MAS dispatchati e ricevuti nel ciclo MAS↔LLM↔UI

---

## 🎯 Eventi Correnti

| Evento MAS                  | Descrizione                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| `MAS_CONTEXT_APPLY`        | Dispatchato da `useAgentTypingState` quando un agente inizia a digitare     |
| `MAS_CONTEXT_APPLIED`      | Emette conferma dall'orchestratore quando il contextPrompt è stato applicato |

---

## 🧩 Struttura Messaggi

### 📤 `MAS_CONTEXT_APPLY`

```ts
{
  type: "MAS_CONTEXT_APPLY",
  payload: {
    agentId: string;
    threadId: string;
    timestamp?: number;
  }
}
```

### 📥 `MAS_CONTEXT_APPLIED`

```ts
{
  type: "MAS_CONTEXT_APPLIED",
  payload: {
    agentId: string;
    threadId: string;
    contextId: string;
    tokens?: number;
  }
}
```

---

## 🧪 Componenti Coinvolti

| Componente / Hook           | Interazione con Evento MAS                |
|----------------------------|-------------------------------------------|
| `useAgentTypingState.ts`   | Dispatcha `MAS_CONTEXT_APPLY`             |
| `contextPromptManager.ts`  | Riceve `MAS_CONTEXT_APPLY`, dispatcha `MAS_CONTEXT_APPLIED` |
| `AgentFlowTimeline.tsx`    | Visualizza badge al ricevimento `MAS_CONTEXT_APPLIED` |
| `AgentFlowDebugger.tsx`    | Log degli eventi e trigger UI dinamici    |

---

## 🔗 Event Source

Tutti gli eventi sono tipizzati tramite `@core/messages/events.ts`:

```ts
export enum MASEvent {
  CONTEXT_APPLY = 'MAS_CONTEXT_APPLY',
  CONTEXT_APPLIED = 'MAS_CONTEXT_APPLIED',
}
```

---

## 📌 Note Future-proof

- Eventi futuri verranno documentati qui.
- Ogni nuova subscription MAS deve usare `MASEvent` per coerenza.

---

✅ **Registro aggiornato automaticamente via MAS Batch Flow.** 