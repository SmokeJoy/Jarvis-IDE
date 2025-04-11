# MCP-F6: Piano di Rilascio Finale

## Stato attuale

Il backend di MCP-F6 (PromptProfile Manager) è completo e testato. Tutti i componenti essenziali sono stati implementati e verificati:

- ✅ `SettingsManager.ts`: Supporto per profili multipli con persistenza in `settings.json`
- ✅ `WebviewMessageType`: Nuovi tipi per gestione profili
- ✅ `extension.ts`: Handler per operazioni su profili (GET, SWITCH, CREATE, DELETE, UPDATE)
- ✅ `contextPromptManager.ts`: Caching locale e sincronizzazione con l'estensione

## Fase finale: UI e test automatici

Per completare il rilascio, abbiamo preparato:

1. **Script di test automatico**: `webview-ui/src/F6-test-runner.js`
   - Test completo del `ProfileSelector` e `ProfileManagerModal`
   - Verifica integrazione con editor, preview markdown e persistence layer
   - Esposizione della funzione `window.runMcpF6Tests()` per esecuzione dalla console

2. **Procedura di verifica**:
   - Aprire l'editor dei system prompt in VS Code
   - Aprire la console degli strumenti di sviluppo (F12)
   - Copiare lo script di test o usare l'URL con parametro `autotest=true`
   - Eseguire `window.runMcpF6Tests()` e verificare i risultati

## Piano di rilascio (08:00)

### 1. Verifiche finali (07:30-07:40)
- [ ] Eseguire i test automatici in ambiente di sviluppo
- [ ] Verificare lo script di build completo: `npm run build`
- [ ] Controllare che il file `settings.json` contenga correttamente i profili
- [ ] Verificare la migrazione dei prompt esistenti nel profilo predefinito

### 2. Build del pacchetto (07:40-07:50)
- [ ] Incrementare la versione in `package.json` (patch version)
- [ ] Aggiornare il CHANGELOG.md con le novità di MCP-F6
- [ ] Eseguire `vsce package` per generare il file .vsix
- [ ] Installare localmente l'estensione per test finali

### 3. Documentazione e rilascio (07:50-08:00)
- [ ] Assicurarsi che la documentazione in `docs/mcp/F6-validation-tests.md` sia completa
- [ ] Aggiornare `README.md` con le nuove funzionalità
- [ ] Creare tag git per la versione
- [ ] Caricare il pacchetto .vsix sul repository delle release

## Note per il team di frontend

Componenti UI da integrare nel prossimo sprint:
- `ProfileSelector.tsx`: Selettore a dropdown dei profili
- `ProfileManagerModal.tsx`: Interfaccia CRUD per gestione profili
- Integrazione in `SystemPromptEditor.tsx`: UI per selezione e gestione profili

## Istruzioni per test manuali

1. Avvia l'estensione VS Code in modalità debug
2. Apri un workspace e visualizza l'editor dei system prompt
3. Verifica che il selettore profili mostri il profilo predefinito
4. Crea un nuovo profilo e verifica che venga salvato in `settings.json`
5. Modifica i prompt in diversi profili e verifica la persistenza tra riavvii
6. Verifica che il cambio di profilo aggiorni correttamente l'editor

## Contatti per supporto

- Backend: ai-developer-1@cline.dev
- Frontend: ai-developer-2@cline.dev
- Testing: qa-team@cline.dev 