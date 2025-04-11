# Test Setup per Jarvis-IDE

## Panoramica

Questo progetto utilizza Vitest come framework di testing. Abbiamo recentemente migrato da Jest a Vitest per migliorare prestazioni e compatibilità con il resto dell'ecosistema.

## Struttura della directory tests

- `setup.ts`: Configurazione globale per Vitest, inclusi mock e utility di test
- `README.md`: Questo file di documentazione

## Setup Vscode Mock

Uno dei principali problemi nel testing di estensioni VS Code è la necessità di simulare l'API di VS Code. Il file `setup.ts` fornisce un mock completo dell'API VS Code con simulazioni realistiche di:

- `workspace`: workspace, file system, configurazioni
- `window`: UI, editor, output channels
- `commands`: comandi registrati ed esecuzione
- `languages`: provider linguistici e diagnostica
- Classi di utilità come `Uri`, `Position`, `Range`, ecc.

## Progresso della migrazione

Abbiamo implementato uno script per tracciare la migrazione da Jest a Vitest:

```bash
npx ts-node scripts/track-vitest-migration.ts
```

Lo script genera un report dettagliato che mostra:
- File già migrati a Vitest
- File ancora in Jest
- File ibridi che potrebbero avere problemi
- Percentuale di completamento

## Problemi noti

### Errore "Expected a semicolon"

Alcuni test presentano un errore di parsing con il messaggio "Expected a semicolon". Questo potrebbe essere causato da:

1. Incompatibilità con JSX/TSX in alcune configurazioni
2. Problema di parsing in alcuni import o sintassi
3. Configurazione del parser rollup

**Soluzione temporanea**: Convertire manualmente i file di test da Jest a Vitest, prestando attenzione alla sintassi.

### Utilizzo del mock di vscode

Per utilizzare correttamente il mock di vscode:

```ts
// Prima di importare qualsiasi cosa che dipende da vscode
import { vi } from 'vitest';
import vscode from 'vscode'; // Questo sarà automaticamente mockato

// Il tuo test qui...
```

## Comandi utili

### Esecuzione dei test

```bash
# Esegui tutti i test
pnpm vitest run

# Esegui un singolo file di test
pnpm vitest run src/path/to/test.ts

# Esegui test in modalità watch
pnpm vitest
```

### Migrazione automatica (sperimentale)

```bash
pnpm exec jscodeshift -t node_modules/jest-migrate/lib/transforms/jest-globals-transform.js <file>
``` 