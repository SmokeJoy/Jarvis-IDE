# Policy per la gestione degli script di utilità

Questo documento definisce le linee guida ufficiali per lo sviluppo, la manutenzione e l'utilizzo degli script di utilità all'interno del progetto.

## Principi generali

1. **Standardizzazione**: Tutti gli script devono seguire standard coerenti di codifica, testing e documentazione.
2. **Tipizzazione**: Gli script devono essere scritti preferibilmente in TypeScript per migliorare robustezza e manutenibilità.
3. **Testabilità**: Gli script devono essere testabili e avere test unitari quando possibile.
4. **Documentazione**: Ogni script deve essere accompagnato da documentazione che ne illustri scopo, utilizzo e comportamento.
5. **Integrazione**: Gli script devono essere integrati nel flusso di sviluppo attraverso package.json e pipeline CI/CD.

## Migrazione da JavaScript a TypeScript

### Obiettivi della migrazione

- Migliorare la qualità e la manutenibilità degli script
- Ridurre gli errori durante lo sviluppo grazie alla tipizzazione statica
- Standardizzare il codebase
- Semplificare la pipeline di build e test

### Processo di migrazione

1. **Valutazione**: Identificare gli script da migrare e stabilire priorità basate su complessità e utilizzo.
2. **Progettazione**: Definire l'interfaccia TypeScript (tipi, interfacce) prima dell'implementazione.
3. **Implementazione**: Sviluppare la versione TypeScript mantenendo la compatibilità con la versione JavaScript.
4. **Testing**: Sviluppare test unitari per la nuova implementazione.
5. **Periodo di transizione**: Mantenere entrambe le versioni (JS e TS) per un periodo limitato (2-4 settimane).
6. **Deprecazione**: Deprecare la versione JavaScript con avvisi appropriati.
7. **Rimozione**: Rimuovere la versione JavaScript dopo il periodo di transizione.

### Requisiti tecnici

- Gli script TypeScript devono essere posizionati in `src/scripts/`
- Devono utilizzare il sistema di moduli ESM (import/export)
- Devono includere tipi espliciti per parametri e valori di ritorno
- Devono esportare le funzioni principali per facilitare il testing
- Devono gestire correttamente gli errori

## Struttura degli script

### Organizzazione del codice

```
src/
  scripts/
    __tests__/          # Test unitari
      script-name.test.ts
    utils/              # Utilità condivise tra script
      common.ts
    script-name.ts      # Script principale
```

### Template per nuovo script

```typescript
#!/usr/bin/env node

/**
 * Nome dello script
 * ================
 * Breve descrizione dello script.
 *
 * Utilizzo:
 * $ pnpm script-name [--opzione] <argomento>
 *
 * @author Nome Autore
 * @date YYYY-MM-DD
 */

// Importazioni
import path from 'node:path';
import fs from 'node:fs/promises';

// Tipi
interface Options {
  // Definizione opzioni
}

/**
 * Funzione principale
 */
export async function main(): Promise<void> {
  try {
    // Implementazione
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

/**
 * Analizza gli argomenti della riga di comando
 */
export function parseArgs(args: string[]): Options {
  // Implementazione
  return {} as Options;
}

// Esecuzione dello script quando chiamato direttamente
if (require.main === module) {
  main().catch((error) => {
    console.error('Errore:', error);
    process.exit(1);
  });
}
```

## Testing degli script

### Requisiti per i test

1. **Copertura**: I test devono coprire almeno l'80% del codice dello script.
2. **Isolamento**: I test devono usare mock per file system, rete e altri moduli esterni.
3. **Completezza**: I test devono verificare casi normali e casi di errore.

### Test di unità vs integrazione

- **Test unitari**: Testano le singole funzioni e componenti isolatamente
- **Test di integrazione**: Testano lo script in un ambiente realistico

### Integrazione con Jest

I test dovrebbero utilizzare Jest e seguire la struttura:

```typescript
describe('nome-script', () => {
  // Setup comune
  beforeEach(() => {
    // Preparazione
  });

  // Test per la funzionalità principale
  describe('funzionalità-x', () => {
    test('dovrebbe comportarsi in modo y quando z', () => {
      // Implementazione
    });
  });
});
```

## Integrazione CI/CD

### Pipeline di test

- I test degli script devono essere eseguiti in CI per ogni PR
- La copertura dei test deve essere monitorata

```yaml
# Esempio di configurazione GitHub Actions
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

### Lint e formattazione

- Gli script devono rispettare le regole ESLint del progetto
- Gli script devono essere formattati con Prettier

## Documentazione

### Requisiti

- Ogni script deve avere un header con descrizione, utilizzo e autore
- Le funzioni esportate devono avere JSDoc
- Le opzioni e gli argomenti devono essere documentati

### Esempio di documentazione

```typescript
/**
 * Processa un file aggiungendo estensione .js alle importazioni.
 * 
 * @param filePath - Percorso del file da processare
 * @param options - Opzioni di configurazione
 * @param options.check - Se true, non modifica il file ma segnala solo i cambiamenti
 * @param options.verbose - Se true, stampa informazioni dettagliate
 * @returns Oggetto con informazione se il file è stato modificato
 */
export async function processFile(
  filePath: string, 
  options: { check: boolean; verbose: boolean }
): Promise<{ modified: boolean }> {
  // Implementazione
}
```

## Distribuzione e utilizzo

### Script in package.json

Tutti gli script devono essere registrati in `package.json`:

```json
{
  "scripts": {
    "fix-imports": "tsx src/scripts/fix-imports.ts",
    "check-imports": "tsx src/scripts/fix-imports.ts --check"
  }
}
```

### Guida utente

Quando possibile, gli script dovrebbero fornire guida con flag `--help`:

```
Utilizzo: pnpm fix-imports [opzioni] [file...]

Opzioni:
  --check     Verifica le importazioni senza modificare i file
  --verbose   Stampa informazioni dettagliate
  --help      Mostra questo messaggio di aiuto
```

## Mantenimento e aggiornamento

### Versionamento

- Le modifiche rilevanti agli script devono essere documentate nel CHANGELOG
- Le modifiche che cambiano il comportamento devono essere comunicate al team

### Revisione periodica

- Gli script devono essere rivisti ogni 6 mesi per assicurarsi che rimangano attuali
- Gli script non più necessari devono essere deprecati e rimossi

## Conclusione

Questa policy fornisce una guida completa per la creazione, manutenzione e utilizzo degli script di utilità. L'adozione di queste linee guida migliorerà la qualità, la manutenibilità e l'usabilità degli script all'interno del progetto.

## Appendice: Checklist di qualità

- [ ] Lo script è scritto in TypeScript
- [ ] Lo script ha test unitari con copertura >80%
- [ ] Lo script è documentato con JSDoc
- [ ] Lo script ha una guida utente (--help)
- [ ] Lo script è registrato in package.json
- [ ] Lo script rispetta le regole ESLint
- [ ] Lo script gestisce correttamente gli errori
- [ ] Lo script è testato in CI 