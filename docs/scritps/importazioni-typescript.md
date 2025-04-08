# Gestione delle importazioni in TypeScript: il caso dell'estensione .js

Questo documento spiega il problema delle importazioni relative nei progetti TypeScript e come risolverlo usando lo script `fix-imports.ts`.

## Il problema delle importazioni in TypeScript

TypeScript richiede che le importazioni di moduli seguano specifiche regole di risoluzione. Un problema comune nei progetti TypeScript moderni riguarda come gestire le importazioni relative:

### Problema 1: TypeScript vs Node.js e importazioni ES modules

In un progetto TypeScript configurato per generare moduli ES, le importazioni si comportano in modo diverso tra l'ambiente di sviluppo e quello di produzione:

```typescript
// Durante lo sviluppo (file .ts)
import { Something } from './other-file';

// Nel codice compilato (file .js)
import { Something } from './other-file.js'; // Richiede l'estensione .js!
```

Quando TypeScript compila i file, il modulo Node.js si aspetta di vedere l'estensione `.js` nelle importazioni, anche se il file sorgente è `.ts`. Senza questa estensione, si ottiene un errore del tipo:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './other-file'
```

### Problema 2: IDE e compilazione TypeScript

D'altro canto, il compilatore TypeScript e la maggior parte degli IDE come VS Code preferiscono importazioni senza estensione:

```typescript
// Preferito dal compilatore tsc e VS Code
import { Something } from './other-file';
```

Con l'estensione esplicita `.js`, TypeScript in alcune configurazioni potrebbe segnalare errori:

```
TS2835: Relative import paths need explicit file extensions in EcmaScript imports
```

## La soluzione: `fix-imports.ts`

Lo script `fix-imports.ts` risolve questo conflitto aggiungendo automaticamente l'estensione `.js` a tutte le importazioni relative nei file TypeScript, garantendo che il codice funzioni sia durante lo sviluppo che dopo la compilazione.

### Come funziona lo script

1. Analizza ricorsivamente tutti i file `.ts` e `.tsx` in una directory
2. Identifica tutte le importazioni relative 
3. Aggiunge l'estensione `.js` a quelle che ne sono prive
4. Opzionalmente, può rimuovere le estensioni esistenti (modalità inversa)

### Esempi di trasformazioni

Lo script trasforma:

```typescript
import { Component } from './components/Button';
import type { Props } from '../types/component-types';
import styles from './styles/main.css';
```

In:

```typescript
import { Component } from './components/Button.js';
import type { Props } from '../types/component-types.js';
import styles from './styles/main.css';  // Non modificato perché non è un modulo JS
```

### Casi speciali gestiti

1. **Importazioni di tipi**: Le importazioni di tipo vengono gestite correttamente
   ```typescript
   import type { Something } from './types';  // Diventa './types.js'
   ```

2. **Percorsi index**: I percorsi di directory vengono trattati come riferimenti impliciti a index
   ```typescript
   import { util } from './utils';  // Diventa './utils/index.js' o './utils.js'
   ```

3. **Importazioni non-JS**: Le importazioni non-JS come CSS o JSON rimangono invariate
   ```typescript
   import styles from './styles.css';  // Rimane invariato
   ```

4. **Importazioni assolute/pacchetti**: Le importazioni di pacchetti o assolute non vengono modificate
   ```typescript
   import React from 'react';  // Rimane invariato
   ```

## Configurazione per il tuo progetto

Per configurare correttamente TypeScript per l'uso con ES modules, assicurati che il tuo `tsconfig.json` contenga:

```json
{
  "compilerOptions": {
    "module": "NodeNext", // o "ESNext", "ES2020", ecc.
    "moduleResolution": "NodeNext",
    // altre opzioni...
  }
}
```

## Quando usare lo script

Lo script dovrebbe essere eseguito:

1. Prima di compilare il progetto per la distribuzione
2. Dopo operazioni di refactoring che hanno creato nuovi file o importazioni
3. Come parte del workflow di CI/CD
4. Opzionalmente, come hook pre-commit per assicurarsi che tutte le importazioni siano corrette

## Opzioni dello script

Lo script supporta diverse opzioni:

- `--files [file1,file2,...]`: Corregge solo i file specificati
- `--remove`: Rimuove le estensioni `.js` invece di aggiungerle (modalità inversa)
- `--check`: Controlla solo senza fare modifiche, utile per CI/CD
- `--verbose`: Mostra più informazioni durante l'esecuzione

## Esempi di utilizzo

```bash
# Correggi tutte le importazioni nella directory src
ts-node src/scripts/fix-imports.ts src

# Controlla senza modificare
ts-node src/scripts/fix-imports.ts --check src

# Rimuovi estensioni .js (utile per sviluppo locale)
ts-node src/scripts/fix-imports.ts --remove src

# Correggi file specifici
ts-node src/scripts/fix-imports.ts --files src/components/Button.tsx,src/utils/helpers.ts
```

## Conclusioni

La gestione delle importazioni in TypeScript e Node.js con ES modules può essere impegnativa. Lo script `fix-imports.ts` automatizza questo processo, garantendo che le importazioni siano sempre corrette per l'ambiente target e riducendo errori di runtime relativi ai percorsi di importazione.

## Risorse utili

- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Node.js ECMAScript Modules](https://nodejs.org/api/esm.html)
- [ES Modules in Node.js](https://nodejs.org/api/packages.html#packages_imports) 