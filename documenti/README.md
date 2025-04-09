# Script di correzione automatica degli import

Questo repository contiene uno script TypeScript per correggere automaticamente le dichiarazioni di import nei file TypeScript/JavaScript, principalmente pensato per progetti che utilizzano ES modules.

## Lo script principale: fix-imports.ts

Lo script `fix-imports.ts` analizza ricorsivamente i file TypeScript e JavaScript in una directory e corregge automaticamente le dichiarazioni di import, aggiungendo l'estensione `.js` agli import relativi, che è richiesta quando si utilizzano ES modules.

### Funzionalità

- Aggiunge l'estensione `.js` agli import relativi (es. `from './utils/helper'` diventa `from './utils/helper.js'`)
- Corregge la sintassi degli import di tipo (es. `import { type User }` diventa `import type { User }`)
- Rimuove le estensioni `.js` duplicate (es. `.js.js` diventa `.js`)
- Supporta la modalità "dry run" per visualizzare le modifiche senza applicarle
- Esclude automaticamente directory specifiche (es. `node_modules`, `dist`)
- Fornisce statistiche dettagliate sul numero di file modificati

### Utilizzo

```bash
# Eseguire lo script in modalità normale (applica le modifiche)
pnpm ts-node scripts/fix-imports.ts src/

# Eseguire in modalità dry run (mostra solo i cambiamenti senza applicarli)
pnpm ts-node scripts/fix-imports.ts src/ --dry-run

# Escludere directory specifiche
pnpm ts-node scripts/fix-imports.ts src/ --exclude dist,temp
```

## Integrazione con il workflow di sviluppo

Lo script è progettato per essere integrato nel workflow di sviluppo in diversi modi:

1. **Manualmente**: Eseguito dagli sviluppatori quando necessario
2. **Pre-commit hook**: Configurato come hook git pre-commit per garantire che tutti i file abbiano import corretti
3. **CI/CD**: Integrato nel pipeline CI/CD per verificare che gli import siano corretti

### Configurazione come pre-commit hook

Per utilizzare lo script come pre-commit hook con Husky:

1. Installare Husky se non già presente:
   ```bash
   pnpm add -D husky
   pnpm husky install
   ```

2. Creare un pre-commit hook:
   ```bash
   pnpm husky add .husky/pre-commit "pnpm ts-node scripts/fix-imports.ts src/ --pre-commit"
   ```

## Test

Lo script è fornito con una suite di test Jest che verifica tutte le funzionalità principali. Per eseguire i test:

```bash
pnpm jest scripts/__tests__/fix-imports.test.ts
```

I test utilizzano un file system virtuale (memfs) per simulare i file e le directory, garantendo che lo script funzioni correttamente in vari scenari.

## Migrazione da JavaScript a TypeScript

Questo script è stato migrato da JavaScript a TypeScript per beneficiare di:

- Migliore controllo dei tipi
- Maggiore manutenibilità
- IDE integration più efficiente
- Documentazione dei tipi integrata

La versione JavaScript originale (`fix-imports.js`) è stata deprecata e verrà rimossa in un futuro aggiornamento.

## Contribuire

Contributi per migliorare lo script sono benvenuti! Assicurati di eseguire i test prima di inviare una pull request. 