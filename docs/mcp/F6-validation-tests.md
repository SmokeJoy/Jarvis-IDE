# MCP-F6: Prompt di Test per Validazione

Questo documento contiene una serie di prompt di test automatici per validare le funzionalità implementate nel MCP-F6 (PromptProfile Manager). Questi test sono progettati per verificare l'integrità e la funzionalità del sistema completo.

## Struttura dei Test

I test sono organizzati secondo le funzionalità principali del PromptProfile Manager:

1. **ProfileSelector**: Test per la selezione e il cambio dei profili
2. **ProfileManagerModal**: Test per la creazione, modifica ed eliminazione dei profili
3. **Persistenza**: Test per verificare il salvataggio in localStorage e settings.json
4. **Integrazione UI**: Test per verificare l'integrazione con SystemPromptEditor

## Procedura di Test

### Test Set 1: Funzionalità Base del ProfileSelector

**Prompt 1.1: Verifica presenza e caricamento del selettore profili**
```
Apri l'editor di system prompt in VS Code.
Verifica che il selettore di profili sia visibile nella parte superiore.
Conferma che mostri il profilo attualmente attivo.
```

**Prompt 1.2: Cambio di profilo**
```
Seleziona un profilo diverso dal selettore a tendina.
Verifica che il contenuto degli editor di prompt cambi di conseguenza.
Conferma che il contenuto mostrato corrisponda al profilo selezionato.
```

**Prompt 1.3: Verifica persistenza dopo cambio**
```
Dopo aver cambiato profilo, chiudi e riapri l'editor di system prompt.
Verifica che il profilo precedentemente selezionato sia ancora attivo.
```

### Test Set 2: Funzionalità del ProfileManagerModal

**Prompt 2.1: Apertura del modal manager**
```
Clicca sul pulsante "Gestisci profili" accanto al selettore.
Verifica che si apra un modal con la lista dei profili esistenti.
Conferma che siano presenti i pulsanti per le operazioni CRUD.
```

**Prompt 2.2: Creazione di un nuovo profilo**
```
Nel modal di gestione profili, clicca su "Nuovo profilo".
Inserisci "Test Profile" come nome.
Verifica che il nuovo profilo venga creato e appaia nella lista.
```

**Prompt 2.3: Modifica di un profilo**
```
Seleziona il profilo "Test Profile" creato precedentemente.
Clicca sul pulsante di modifica.
Cambia il nome in "Modified Test Profile".
Salva le modifiche e verifica che il nome sia aggiornato nella lista.
```

**Prompt 2.4: Impostazione del profilo predefinito**
```
Seleziona il profilo "Modified Test Profile".
Clicca sul pulsante per impostarlo come predefinito.
Verifica che venga contrassegnato come profilo predefinito nella lista.
Chiudi e riapri l'editor per confermare che venga caricato automaticamente.
```

**Prompt 2.5: Eliminazione di un profilo**
```
Seleziona il profilo "Modified Test Profile".
Clicca sul pulsante di eliminazione.
Conferma l'eliminazione nel dialogo di conferma.
Verifica che il profilo non sia più presente nella lista.
```

### Test Set 3: Persistenza e Sincronizzazione

**Prompt 3.1: Verifica persistenza in localStorage**
```
Crea un nuovo profilo chiamato "Storage Test".
Apri la console del browser e verifica che localStorage contenga una voce per i profili.
Controlla che il profilo "Storage Test" sia presente nell'oggetto memorizzato.
```

**Prompt 3.2: Verifica sincronizzazione con settings.json**
```
Crea un nuovo profilo chiamato "Settings Test".
Chiudi e riapri VS Code.
Verifica che il profilo "Settings Test" sia ancora disponibile.
Apri settings.json e conferma che i profili siano salvati correttamente.
```

**Prompt 3.3: Test di roundtrip completo**
```
Modifica il profilo "Settings Test" cambiando il prompt di sistema.
Salva le modifiche e chiudi l'editor.
Riapri l'editor e verifica che le modifiche siano state mantenute.
Controlla sia localStorage che settings.json per confermare la sincronizzazione.
```

### Test Set 4: Integrazione con SystemPromptEditor

**Prompt 4.1: Verifica rendering Markdown del prompt di sistema**
```
Seleziona un profilo esistente.
Attiva la modalità di anteprima Markdown.
Verifica che il rendering Markdown funzioni correttamente nel preview.
```

**Prompt 4.2: Verifica salvataggio delle modifiche nel profilo attivo**
```
Seleziona un profilo esistente.
Modifica il contenuto del prompt di sistema aggiungendo del testo.
Salva le modifiche.
Cambia profilo e poi torna al profilo modificato.
Verifica che le modifiche siano state salvate correttamente.
```

**Prompt 4.3: Verifica della funzionalità multispot (system, user, persona, context)**
```
Crea un nuovo profilo chiamato "MultiSlot Test".
Aggiungi contenuto in tutti gli slot disponibili: system, user, persona e context.
Salva il profilo e cambia ad un altro.
Torna al profilo "MultiSlot Test" e verifica che tutti gli slot mantengano i valori inseriti.
```

## Script di Test Automatico

Per facilitare il testing, è stato creato uno script JavaScript che può essere eseguito nella console dell'extension webview per automatizzare la validazione:

```javascript
// Includere il contenuto di F6-test-runner.js
// Lo script verificherà automaticamente le funzionalità principali
```

Per eseguire i test automatici:
1. Apri l'editor di system prompt in VS Code
2. Apri la console degli strumenti di sviluppo (F12 o Cmd+Option+I)
3. Copia e incolla lo script F6-test-runner.js
4. Esegui `window.runMcpF6Tests()` nella console

## Risultati Attesi

Dopo aver eseguito tutti i test, i risultati attesi sono:
- Tutti i componenti UI sono presenti e funzionanti
- Le operazioni CRUD sui profili funzionano correttamente
- I dati vengono salvati e sincronizzati tra localStorage e settings.json
- L'interfaccia utente risponde correttamente alle interazioni
- Il rendering Markdown funziona come previsto

## Documentazione dei Risultati

Dopo aver eseguito i test, registrare i risultati in questo formato:

| Test ID | Descrizione | Stato | Note |
|---------|-------------|-------|------|
| 1.1     | Verifica presenza selettore | | |
| 1.2     | Cambio profilo | | |
| 1.3     | Persistenza dopo cambio | | |
| ... | ... | ... | ... |

Utilizzare i seguenti stati:
- ✅ PASS: Il test è stato completato con successo
- ❌ FAIL: Il test non è stato completato con successo
- ⚠️ WARN: Il test è stato completato con avvertimenti
- 🔄 SKIP: Il test è stato saltato

## Conclusione

Una volta completati tutti i test, è possibile procedere con la fase di rilascio se tutti i test sono passati. In caso di fallimenti, documentare i problemi riscontrati e procedere con la correzione prima del rilascio. 