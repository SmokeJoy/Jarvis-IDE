# PR: feat(webview): union dispatcher hooks e componenti React

## 🔍 Descrizione

Questa PR implementa il pattern Union Dispatcher Type-Safe per i componenti React e hooks del frontend WebView. Estende l'implementazione già approvata su `WebviewMessageHandler.ts` per completare l'architettura tipizzata end-to-end.

Il pattern sostituisce l'uso di `any` e type assertion non sicure con unioni discriminate verificate staticamente nei componenti React e hooks, migliorando la robustezza del codice e la sicurezza di tipo.

## 🏗️ Implementazione

### 1️⃣ `useExtensionMessage.ts`
- Creazione di metodo `postMessage<T extends WebviewMessageUnion>` type-safe
- Aggiunta di helper `sendMessageByType` per casi d'uso semplici
- Documentazione inline completa

### 2️⃣ `PromptEditor.tsx`
- Implementazione di interfaccia `InfoMessage` che estende `WebviewMessageUnion`
- Creazione di type guard `isInfoMessage()`
- Integrazione con l'hook refactorizzato
- Utilizzo di pattern type-safe nel componente

## 🧪 Test Coverage

Test eseguiti e copertura mantenuta con successo. I test verificano:
- Casi positivi (messaggi validi)
- Casi negativi (gestione messaggi non riconosciuti)
- Edge case (inferenza di tipo)

```
-------------------------|---------|----------|---------|---------|-------------------
File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------|---------|----------|---------|---------|-------------------
All files                |   95.12 |    89.35 |   94.26 |   95.67 |
 hooks/useExtensionMessage|  100.00 |   100.00 |  100.00 |  100.00 |
 components/PromptEditor |   94.47 |    87.23 |   93.33 |   94.83 | 36-42, 68-71
-------------------------|---------|----------|---------|---------|-------------------
```

## 📚 Documentazione

Aggiornata documentazione nei seguenti moduli:
- `documenti/docs34/update/hooks/usePostMessage-refactor.md` (logbook)
- `documenti/docs34/update/components/PromptEditor-refactor.md` (logbook)
- `documenti/docs34/update/struttura-progetto-hooks-react.md` (struttura)

## 🔄 Modifiche

- `webview-ui/src/hooks/useExtensionMessage.ts` - Conversione a hook type-safe
- `webview-ui/src/components/PromptEditor.tsx` - Implementazione interfaccia e type guard

## 👀 Note di Review

- Il pattern può essere esteso a tutti gli altri componenti React che comunicano con l'estensione
- L'approccio mantiene la retrocompatibilità con il codice esistente
- L'architettura type-safe ora copre l'intero ciclo di vita dei messaggi, dal frontend al backend 