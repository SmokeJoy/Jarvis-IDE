# 🔍 Coverage Map MAS & Hooks

## Unit Test Coverage (Task F5)

| File                                | Coppie principali testate                          | Edge case | Snapshot |
|-------------------------------------|----------------------------------------------------|-----------|----------|
| webview-ui/src/data/contextPromptManager.ts | ✔️ Crea profilo, aggiorna, elimina, set attivo, reset | ✔️        | ✖️       |
| src/mas/agent/mas-dispatcher.ts     | ⏳ Da aggiungere: handleMASMessage, dispatchMASContextEvent | ⏳        | ⏳       |
| src/hooks/useThreadScrollLock.ts    | ⏳ Da aggiungere: edge-case locking/unlocking        | ⏳        | ⏳       |

- Ogni suite usa `describe`, `it`, `expect` e simula errori WS/ MAS_CONTEXT_APPLY/AGENT_TYPING.
- Copertura edge-case pronta per contextPromptManager.
- Restano da completare copertura Jest per MASDispatcher e useThreadScrollLock.

---

**Ultimo aggiornamento:** Task F5 – Unit/Jest Coverage – Work in progress.