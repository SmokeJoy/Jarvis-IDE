# PR: feat(webview): union dispatcher WebviewMessageHandler

## 🔍 Descrizione

Questa PR implementa il pattern Union Dispatcher Type-Safe per i componenti `WebviewMessageHandler` e `TaskQueueMessageHandler` come richiesto dal Supervisore AI.

Il pattern sostituisce l'uso di `any` e type assertion non sicure con unioni discriminate verificate staticamente, migliorando la robustezza del codice e la sicurezza di tipo.

## 🏗️ Implementazione

- Creazione classe astratta `BaseWebviewMessageHandler` con dispatcher type-safe
- Reimplementazione di `TaskQueueMessageHandler` estendendo la base
- Conversione dei tipi di payload a unioni discriminate
- Utilizzo di `Extract<T>` per garantire sicurezza di tipo nel dispatcher

## 🧪 Test e Coverage

Test eseguiti con successo, mantenendo coverage ≥90%:

```
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------|---------|----------|---------|---------|-------------------
All files              |   93.28 |    85.71 |   91.30 |   93.52 |
 WebviewMessageHandler |  100.00 |   100.00 |  100.00 |  100.00 |
 TaskQueueMessageHandle|   92.11 |    83.33 |   90.00 |   92.45 | 151-155,224-228
-----------------------|---------|----------|---------|---------|-------------------
```

## 📚 Documentazione

Aggiornata documentazione nei seguenti moduli:
- `documenti/docs34/update/WebviewMessageHandler-refactor.md` (logbook)
- `documenti/docs34/update/struttura-progetto.md` (struttura)

## 🔄 Modifiche

- `src/webview/handlers/WebviewMessageHandler.ts` - Aggiunta classe base astratta
- `src/webview/handlers/TaskQueueMessageHandler.ts` - Conversione a union dispatcher
- `src/shared/types/webviewMessageUnion.ts` - Nessuna modifica, riutilizzo tipi esistenti

## 👀 Note di Review

- Il pattern semplifica l'aggiunta di nuovi handler di messaggi in futuro
- La type safety elimina un'intera classe di errori potenziali 
- Implementazione conforme alle specifiche del Supervisore AI 