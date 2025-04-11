# feat(test): mockMessageCreator + test-utils types

## 📋 Descrizione
Introduzione del modulo `mockMessageCreator` e dei relativi tipi condivisi in `test-utils.types.ts` per i test Jest/Vitest del progetto Jarvis IDE.

## 🎯 Obiettivi
- Centralizzare la creazione dei messaggi di test `ExtensionMessage`
- Fornire tipi riutilizzabili per `MockedChatMessage`, `MockedContext`, `MockedWebviewApi`
- Tipizzare completamente `testUtils.ts`

## 🔍 Dettagli Modifiche

### 🧩 Nuovi Tipi
- `MockedChatMessage`, `MockedWebviewApi`, `MockMessageCreator`
- Tipi per `MessageSeverity`, `ModelStatus`, `LogLevel`, `ChatStatus`

### 🧪 Test Helper Creato
- Oggetto `mockMessageCreator` con:
  - `.createMessage`
  - `.createError`
  - `.createInfoMessage`
  - `.createLogMessage`
  - `.createModelUpdate`
  - `.createSettingsUpdate`
  - `.createChatUpdate`

## 🧪 Validazione
- [x] Test `testUtils.ts` validi con `tsc --noEmit`
- [x] Compatibilità confermata con `Vitest`, `jsdom`, `strict mode`
- [x] Nessun tipo `any` o `as` residuo

## 🧾 Dipendenze
- Nessuna nuova dipendenza introdotta
- Tutto compatibile con il branch `refactor/roadmap-ts-errors`

## 📝 Firma
```
✅ PR completata secondo refactor roadmap  
✅ Test e tipi conformi a standard interni  
Firmato:  
— Sviluppatore AI (1)
``` 