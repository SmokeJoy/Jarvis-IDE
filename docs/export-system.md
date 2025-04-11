# Sistema di Esportazione Unificato

Questo documento descrive l'architettura e l'utilizzo del sistema di esportazione unificato per sessioni di chat, impostazioni e altri dati.

## Architettura

Il sistema di esportazione è organizzato in moduli specializzati:

```
src/utils/exporters/
├── index.ts        # Punto di ingresso principale e funzioni unificate
├── serializers.ts  # Convertitori per formati specifici (JSON, YAML, ecc.)
├── sanitize.ts     # Funzioni per pulire e sanitizzare i dati
├── types.ts        # Definizioni di tipi e interfacce
└── examples/       # Esempi di utilizzo
    └── usage.ts    # Esempi pratici di utilizzo
```

## Funzionalità Principali

### 1. Esportazione Unificata

La funzione principale `exportSession()` offre un punto d'ingresso semplice per esportare dati in vari formati:

```typescript
import { exportSession } from '../utils/exporters';

// Esportazione semplice in JSON
const result = exportSession(sessionData);

// Esportazione in YAML con opzioni
const yamlResult = exportSession(sessionData, 'YAML', {
  pretty: true,
  removeNull: true
});
```

### 2. Sanitizzazione

I dati vengono automaticamente sanitizzati prima dell'esportazione per:

- Rimuovere valori `null` e `undefined` (opzionale)
- Limitare la profondità di oggetti annidati
- Troncare stringhe lunghe e array di grandi dimensioni
- Gestire riferimenti circolari

### 3. Supporto Formati Multipli

Il sistema supporta nativamente:

- **JSON**: Per interoperabilità e storage
- **YAML**: Per prompt e configurazione leggibile

Con supporto pianificato per:

- **CSV**: Per dati tabulari (messaggi di chat)
- **Markdown**: Per documentazione e report
- **HTML**: Per visualizzazione ed embedding

### 4. Gestione Errori Robusta

Tutti gli errori vengono catturati e convertiti in `ExportError` con:

- Messaggi dettagliati
- Causa originale dell'errore
- Logging appropriato

## Utilizzo

### Esempio Base

```typescript
import { exportSession } from '../utils/exporters';

// Dati da esportare
const sessionData = {
  messages: [
    { role: 'user', content: 'Ciao' },
    { role: 'assistant', content: 'Come posso aiutarti?' }
  ],
  settings: { temperature: 0.7 }
};

// Esporta in formato JSON (predefinito)
const result = exportSession(sessionData);
console.log(result.content); // JSON formattato
```

### Esportazione su File

```typescript
import { exportSessionToFile } from '../utils/exporters';

await exportSessionToFile(
  sessionData,
  './exports/sessione-1.json',
  'JSON',
  { pretty: true, removeNull: true }
);
```

### Opzioni di Sanitizzazione

```typescript
const result = exportSession(sessionData, 'YAML', {
  removeNull: true,        // Rimuove proprietà con valore null
  removeUndefined: true,   // Rimuove proprietà con valore undefined
  maxDepth: 5,             // Limita la profondità di navigazione
  maxStringLength: 100,    // Tronca stringhe più lunghe
  maxArrayLength: 50       // Limita il numero di elementi negli array
});
```

## Best Practices

1. **Validazione**: Assicurarsi che i dati siano validi prima dell'esportazione
2. **Gestione Errori**: Utilizzare blocchi try/catch per gestire gli errori di esportazione
3. **Sanitizzazione**: Utilizzare opzioni di sanitizzazione appropriate per il caso d'uso
4. **Performance**: Limitare dimensioni di array e stringhe per file di grandi dimensioni

## Estendere il Sistema

Per aggiungere supporto per un nuovo formato:

1. Aggiungere un nuovo serializzatore in `serializers.ts`
2. Aggiornare l'enumerazione `ExportFormat` in `types.ts`
3. Aggiungere il caso nel metodo `exportSession()` in `index.ts`
4. Aggiungere test appropriati in `__tests__/`

## Riferimenti

- [Documentazione AJV](https://ajv.js.org/) - Per la validazione JSON
- [Documentazione YAML](https://eemeli.org/yaml/) - Per la serializzazione YAML
- [Guida al Testing](./testing.md) - Per test di integrazione 