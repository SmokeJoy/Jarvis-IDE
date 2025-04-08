# Script Fix-Imports

## Descrizione
Lo script `fix-imports.ts` è uno strumento automatico che corregge i problemi di importazione nei progetti TypeScript configurati per ESM. Lo script affronta specificamente i seguenti problemi:

1. Aggiunge l'estensione `.js` agli import relativi (richiesto in ESM)
2. Corregge gli import di tipo utilizzando la sintassi `import type`
3. Rimuove estensioni `.js.js` duplicate
4. Uniforma gli stili di importazione nel progetto

## Requisiti
- Node.js (versione 14.0.0 o superiore)
- TypeScript (versione 5.0.0 o superiore)
- Accesso in lettura e scrittura ai file che devono essere modificati

## Utilizzo

### Esecuzione diretta
```bash
# Esecuzione standard
npx ts-node src/scripts/fix-imports.ts

# Esecuzione in modalità dry-run (nessuna modifica effettiva)
npx ts-node src/scripts/fix-imports.ts --check

# Esecuzione con output dettagliato
npx ts-node src/scripts/fix-imports.ts --verbose

# Limitare l'elaborazione a directory specifiche
npx ts-node src/scripts/fix-imports.ts --dirs=src/components,src/utils
```

### Tramite script NPM
Aggiungi la seguente riga al tuo `package.json`:

```json
"scripts": {
  "fix-imports": "ts-node src/scripts/fix-imports.ts",
  "check-imports": "ts-node src/scripts/fix-imports.ts --check"
}
```

Quindi esegui:
```bash
npm run fix-imports
# o
npm run check-imports
```

## Integrazione CI

### Pre-commit hook
Utilizzando husky e lint-staged, puoi impostare un pre-commit hook per correggere automaticamente gli import nei file modificati:

1. Installa husky e lint-staged:
```bash
npm install --save-dev husky lint-staged
```

2. Configura lint-staged nel `package.json`:
```json
"lint-staged": {
  "*.ts": [
    "ts-node src/scripts/fix-imports.ts --dirs=."
  ]
},
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"
  }
}
```

### GitHub Actions

Esempio di workflow per GitHub Actions:

```yaml
name: Check Imports

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  check-imports:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Check imports
        run: npx ts-node src/scripts/fix-imports.ts --check
```

## Test
Lo script include test di integrazione che possono essere eseguiti con Jest:

```bash
npx jest src/scripts/fix-imports-integration.test.ts
```

## Personalizzazione
Lo script può essere personalizzato modificando le seguenti variabili nel codice sorgente:

- `INCLUDED_EXTENSIONS`: estensioni dei file da processare
- `EXCLUDED_DIRS`: directory da escludere
- `EXCLUDED_FILES`: file specifici da escludere

## Considerazioni per la manutenzione
- Lo script modifica automaticamente i file, quindi è consigliabile avere un buon sistema di controllo versione prima dell'esecuzione
- Le modifiche sono basate su pattern regex, quindi potrebbe non rilevare tutti i casi semanticamente complessi
- Eseguire i test dopo l'applicazione per verificare che non siano stati introdotti errori
- Lo script non modifica la semantica del codice, quindi potrebbe essere necessario un refactoring manuale in alcuni casi 