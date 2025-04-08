# Policy per gli Script di Progetto

## Principi Generali

Gli script di utilità nel nostro progetto devono seguire i seguenti principi:

1. **Standardizzazione**: tutti gli script devono seguire una struttura coerente e adottare convenzioni di codice comuni
2. **Type Safety**: gli script devono essere scritti in TypeScript con typing esplicito
3. **Testabilità**: tutti gli script devono essere testabili e avere test associati
4. **Documentazione**: gli script devono includere documentazione d'uso e istruzioni chiare
5. **Integrazione nel flusso di sviluppo**: gli script devono essere facilmente invocabili tramite `package.json` e integrati nei pipeline CI/CD

## Migrazione da JavaScript a TypeScript

### Obiettivi della Migrazione

La migrazione degli script da JavaScript a TypeScript ha come obiettivi:

1. Migliorare la qualità e la manutenibilità degli script
2. Facilitare l'identificazione degli errori durante lo sviluppo
3. Fornire interfacce di tipo ben definite
4. Standardizzare le convenzioni di codice

### Processo di Migrazione

Per migrare uno script esistente da JavaScript a TypeScript:

1. **Valutazione**: analizzare lo script esistente per comprenderne la funzionalità e le dipendenze
2. **Design**: definire le interfacce e i tipi necessari
3. **Implementazione**: riscrivere lo script in TypeScript, aggiungendo tipi appropriati
4. **Testing**: creare test Jest per tutte le funzionalità
5. **Deprecazione**: marcare la versione JavaScript come deprecata e pianificare la sua rimozione

Durante la migrazione, mantenere sia la versione JavaScript che quella TypeScript fino a quando non si è sicuri che la nuova versione funzioni correttamente in tutti i contesti.

## Requisiti Tecnici per Script TypeScript

Gli script TypeScript devono:

1. Essere collocati nella directory `src/scripts/`
2. Utilizzare moduli ESM (con estensione `.js` negli import)
3. Avere tipi espliciti per tutti i parametri, i valori di ritorno e le variabili esportate
4. Gestire correttamente gli errori con messaggi chiari
5. Includere gestione degli argomenti a riga di comando coerente

## Organizzazione degli Script

### Struttura File

```
src/scripts/
  ├── __tests__/            # Test Jest per gli script
  ├── utils/                # Utility condivise tra script
  ├── fix-imports.ts        # Script singolo
  └── other-script.ts       # Altri script
```

### Template per Nuovi Script

Ogni nuovo script dovrebbe seguire questa struttura di base:

```typescript
#!/usr/bin/env node
/**
 * Nome dello script
 * 
 * Descrizione dello scopo dello script e istruzioni d'uso
 * 
 * @author Nome Autore
 */

// Importazioni
import fs from 'node:fs/promises';
import path from 'node:path';

// Definizione tipi
interface ScriptOptions {
  // Opzioni dello script
}

/**
 * Funzione principale che implementa la logica dello script
 */
export async function main(): Promise<void> {
  try {
    // Implementazione
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Punto di ingresso dello script quando eseguito direttamente
 */
if (require.main === module) {
  main().catch((error) => {
    console.error(`Errore fatale: ${error.message}`);
    process.exit(1);
  });
}
```

## Test

### Requisiti per i Test

Tutti gli script devono avere:

1. **Test unitari** per ogni funzione esportata
2. **Test di integrazione** che verificano il comportamento complessivo dello script
3. **Test di caso d'uso** che simulano scenari reali

### Framework di Test

Utilizzare Jest come framework di test con le seguenti configurazioni:

1. Mock appropriati per le dipendenze esterne (fs, path, etc.)
2. Coverage dei test di almeno 80%
3. Snapshot test per output complessi

### Esempio di Test

```typescript
import { jest } from '@jest/globals';
import fs from 'node:fs/promises';
import { myFunction } from '../my-script.js';

// Mock delle dipendenze
jest.mock('node:fs/promises');

describe('myFunction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dovrebbe comportarsi come previsto', async () => {
    // Arrange
    (fs.readFile as jest.Mock).mockResolvedValue('contenuto mock');
    
    // Act
    const result = await myFunction('file.txt');
    
    // Assert
    expect(result).toBe('risultato atteso');
    expect(fs.readFile).toHaveBeenCalledWith('file.txt', 'utf8');
  });
});
```

## Integrazione CI/CD

I test per gli script devono essere eseguiti in CI per ogni pull request:

1. Configurare un job specifico per il testing degli script
2. Assicurarsi che i test vengano eseguiti in un ambiente pulito
3. Segnalare errori nei test come fallimenti della build

### Esempio di configurazione per GitHub Actions

```yaml
name: Test Scripts

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-scripts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:scripts
```

## Documentazione

### Requisiti per la Documentazione

Ogni script deve avere:

1. Un header con descrizione, utilizzo e autore
2. JSDoc per ogni funzione esportata
3. Documentazione di utilizzo accessibile tramite `--help`

### Esempio di Documentazione

```typescript
/**
 * Processa un file e applica trasformazioni
 * 
 * @param {string} filePath - Percorso del file da processare
 * @param {ProcessOptions} options - Opzioni di elaborazione
 * @returns {Promise<ProcessResult>} Risultato dell'elaborazione
 */
export async function processFile(filePath: string, options: ProcessOptions): Promise<ProcessResult> {
  // Implementazione
}
```

## Distribuzione e Utilizzo

### Registrazione in package.json

Registrare tutti gli script in `package.json` sotto la sezione `scripts`:

```json
{
  "scripts": {
    "fix-imports": "tsx src/scripts/fix-imports.ts",
    "fix-imports:check": "tsx src/scripts/fix-imports.ts --check"
  }
}
```

### Guida per l'Utente

Ogni script deve fornire istruzioni d'uso quando invocato con `--help`:

```
Utilizzo: pnpm fix-imports [opzioni] [file...]

Opzioni:
  --check      Controlla se i file necessitano correzioni senza modificarli
  --verbose    Mostra informazioni dettagliate durante l'esecuzione
  --help       Mostra questo messaggio di aiuto
```

## Manutenzione e Aggiornamento

1. Mantenere un CHANGELOG con le modifiche a ogni script
2. Rivedere periodicamente gli script (ogni 6 mesi) per assicurarsi che rimangano aggiornati
3. Aggiornare la documentazione quando vengono apportate modifiche

## Conclusione

L'adozione di queste linee guida garantirà che gli script del progetto siano di alta qualità, manutenibili e utili al team di sviluppo. La migrazione a TypeScript e l'introduzione di test automatizzati migliorerà la robustezza e l'affidabilità degli script. 