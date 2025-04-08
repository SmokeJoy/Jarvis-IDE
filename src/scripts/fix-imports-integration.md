# Integrazione di fix-imports.ts nel Processo di Sviluppo

Questo documento descrive come integrare lo script `fix-imports.ts` nei flussi di CI/CD e nei processi di sviluppo regolari per mantenere consistenti le importazioni in tutto il codice TypeScript.

## Integrazione con Pre-commit Hooks

Per garantire che tutti i file TypeScript abbiano importazioni corrette prima di essere committati, è possibile utilizzare pre-commit hooks con Husky e lint-staged:

1. Installare le dipendenze necessarie:

```bash
pnpm add -D husky lint-staged
```

2. Configurare lint-staged nel package.json:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "ts-node src/scripts/fix-imports.ts --files",
      "git add"
    ]
  }
}
```

3. Configurare Husky:

```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

## Integrazione nel Flusso CI/CD

Per garantire che tutte le pull request e i branch rispettino le convenzioni di importazione, integrare lo script nel flusso CI/CD:

### GitHub Actions

```yaml
name: Check TypeScript Imports

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  check-imports:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Check TypeScript imports
        run: npx ts-node src/scripts/fix-imports.ts --check
```

### Opzione --check

Aggiungere un'opzione `--check` allo script che verifichi le importazioni senza modificarle e restituisca un codice di errore se ci sono problemi. Questo è utile per i flussi CI:

```typescript
// Aggiungere all'interfaccia Options
interface Options {
  // ...existing options
  check: boolean;
}

// Nella logica principale
if (options.check) {
  const filesWithIssues = await checkImports(files, options);
  if (filesWithIssues.length > 0) {
    console.error(`${filesWithIssues.length} file(s) con problemi di importazione`);
    process.exit(1);
  }
  console.log('Tutti i file hanno importazioni corrette');
  process.exit(0);
}
```

## Integrazione con lo Sviluppo VSCode

### Task VSCode

Aggiungere una task in `.vscode/tasks.json` per eseguire lo script facilmente:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Fix TypeScript Imports",
      "type": "shell",
      "command": "npx ts-node src/scripts/fix-imports.ts ${workspaceFolder}/src",
      "problemMatcher": []
    }
  ]
}
```

### Estensione VSCode

Considerare lo sviluppo di un'estensione VSCode dedicata che utilizzi lo script come dipendenza per:

1. Correggere automaticamente le importazioni quando un file viene salvato
2. Fornire un comando "Fix All Imports" nell'interfaccia VSCode
3. Visualizzare problemi di importazione nella UI

## Integrazione nella Build di Produzione

1. Aggiungere uno script nel package.json per la verifica pre-build:

```json
{
  "scripts": {
    "prebuild": "ts-node src/scripts/fix-imports.ts src --check",
    "build": "tsc -p tsconfig.json"
  }
}
```

2. Modificare il processo di build per eseguire la correzione delle importazioni:

```json
{
  "scripts": {
    "prepare-build": "ts-node src/scripts/fix-imports.ts src",
    "build": "npm run prepare-build && tsc -p tsconfig.json"
  }
}
```

## Migliori Pratiche per il Team di Sviluppo

1. **Automazione**: Utilizzare la correzione automatica durante la build locale
2. **Documentazione**: Documentare la convenzione di importazione nel README
3. **Formazione**: Formare i nuovi sviluppatori sulle convenzioni del progetto
4. **Revisione del codice**: Verificare le convenzioni durante le revisioni del codice

## Roadmap di Miglioramento

1. **Test di unità aggiuntivi**: Coprire più casi edge nei test Jest
2. **Migliore reporting**: Rapporti dettagliati sui file modificati e le modifiche apportate
3. **Configurazione esterna**: Spostare le opzioni in un file di configurazione `.fiximportsrc.json`
4. **Estensione VSCode dedicata**: Integrazione diretta nell'editor

## Utilizzo con VSCode durante lo sviluppo attivo

Per gli sviluppatori che utilizzano VSCode, è possibile configurare un'attività in background che monitora i file e corregge le importazioni:

1. Installare `nodemon` come dipendenza di sviluppo:

```bash
pnpm add -D nodemon
```

2. Aggiungere uno script al package.json:

```json
{
  "scripts": {
    "watch-imports": "nodemon --watch src --ext ts,tsx --exec 'ts-node src/scripts/fix-imports.ts src'"
  }
}
```

3. Eseguire lo script in un terminale separato durante lo sviluppo:

```bash
pnpm watch-imports
```

## Conclusione

L'integrazione completa dello script `fix-imports.ts` nei flussi di sviluppo garantisce coerenza in tutto il codice e previene errori legati alle importazioni, migliorando la qualità complessiva del codice e riducendo il tempo di debugging. 