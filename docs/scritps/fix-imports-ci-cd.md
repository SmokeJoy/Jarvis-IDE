# Integrazione di fix-imports.ts nei workflow CI/CD e processi di sviluppo

Questo documento descrive come integrare efficacemente lo script `fix-imports.ts` nei vari processi di sviluppo e nei workflow CI/CD per un'estensione TypeScript di VSCode.

## Integrazione con hook pre-commit

Per garantire che tutti i file committati abbiano importazioni corrette, puoi utilizzare Husky e lint-staged:

```bash
pnpm add -D husky lint-staged
```

Modifica il file `package.json` per aggiungere la configurazione di lint-staged:

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

Configura Husky per usare lint-staged:

```bash
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

## Integrazione nel workflow CI/CD

Aggiungi una verifica delle importazioni al tuo workflow GitHub Actions creando un file `.github/workflows/check-imports.yml`:

```yaml
name: Verifica Importazioni TypeScript
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
      - name: Installa dipendenze
        run: npm ci
      - name: Verifica importazioni TypeScript
        run: npx ts-node src/scripts/fix-imports.ts --check
```

## Integrazione nello sviluppo VSCode

Per facilitare l'esecuzione dello script durante lo sviluppo, aggiungi un task in `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Correggi Importazioni TypeScript",
      "type": "shell",
      "command": "npx ts-node src/scripts/fix-imports.ts ${workspaceFolder}/src",
      "problemMatcher": []
    }
  ]
}
```

### Considerazioni per un'estensione VSCode dedicata

Per un'integrazione ancora più profonda, potresti sviluppare un'estensione VSCode dedicata che:
- Rileva problemi di importazione mentre scrivi
- Fornisce azioni "quick fix" per aggiungere o rimuovere estensioni .js
- Mostra diagnostica visiva per le importazioni problematiche

## Integrazione nel processo di build di produzione

Aggiungi uno script pre-build nel `package.json`:

```json
{
  "scripts": {
    "check-imports": "ts-node src/scripts/fix-imports.ts --check",
    "fix-imports": "ts-node src/scripts/fix-imports.ts src",
    "prebuild": "npm run check-imports",
    "build": "vsce package"
  }
}
```

Per applicare automaticamente le correzioni durante il processo di build:

```json
{
  "scripts": {
    "prebuild": "npm run fix-imports",
    "build": "vsce package"
  }
}
```

## Best Practices per Team di Sviluppo

1. **Automazione**: Integra la verifica delle importazioni in tutti i livelli del processo di sviluppo.
2. **Documentazione**: Assicurati che tutti gli sviluppatori capiscano il perché delle estensioni .js negli import.
3. **Formazione**: Includi una sessione sulla gestione corretta degli import nelle sessioni di onboarding.
4. **Code Review**: Incoraggia i revisori a prestare attenzione alle dichiarazioni di importazione.

## Roadmap di miglioramento

1. **Test unitari aggiuntivi**: Estendi i test per coprire più casi d'uso.
2. **Migliore reportistica**: Aggiungi output di report in vari formati (JSON, HTML).
3. **Configurazione esterna**: Supporta un file di configurazione dedicato per personalizzare le regole.
4. **Estensione VSCode**: Sviluppa un'estensione dedicata per l'integrazione più profonda.

## Sviluppo attivo con VSCode

Per un'automazione ancora più dinamica durante lo sviluppo, puoi configurare una task di background che monitora i file:

```bash
npm install -D nodemon
```

Aggiungi uno script in `package.json`:

```json
{
  "scripts": {
    "watch-imports": "nodemon --watch src --ext ts,tsx --exec \"ts-node src/scripts/fix-imports.ts src\""
  }
}
```

Aggiungilo come task in `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Monitoraggio Importazioni",
      "type": "shell",
      "command": "npm run watch-imports",
      "isBackground": true,
      "problemMatcher": []
    }
  ]
}
```

---

La completa integrazione di `fix-imports.ts` nei workflow di sviluppo garantisce:
- Consistenza in tutta la codebase
- Prevenzione di errori legati alle importazioni
- Miglioramento della qualità del codice
- Riduzione del tempo speso nel debugging 