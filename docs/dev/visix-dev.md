# Sviluppo del Modulo Visix

## 🚀 Setup Sviluppo

### Prerequisiti
- Node.js 18+
- pnpm 8+
- VSCode (per sviluppo estensione)

### Installazione Dipendenze
```bash
pnpm install
```

### Script Disponibili
```bash
# Sviluppo
pnpm dev        # Watch mode per sviluppo
pnpm build      # Build produzione
pnpm test       # Esegui test
pnpm lint       # Lint codice

# Pubblicazione (local-first)
pnpm link       # Crea link simbolico per test
pnpm unlink     # Rimuovi link simbolico
```

## 🏗️ Struttura Build

Il modulo viene compilato in:
```
dist/
  ├── visix.cjs.js    # CommonJS bundle
  ├── visix.esm.js    # ESM bundle
  ├── visix.d.ts      # TypeScript definitions
```

### Configurazione Build
- `tsup` per bundling
- Output duale (CJS + ESM)
- Source maps per debug
- Minificazione in produzione
- External: React, ReactDOM, Recharts

## 🔌 Integrazione in VSCode

### Setup Plugin
1. Crea link simbolico:
   ```bash
   cd visix
   pnpm link
   cd ../vscode-extension
   pnpm link @jarvis/visix
   ```

2. Importa nel plugin:
   ```typescript
   import { VisixPanel } from './visix-plugin';
   ```

### Debug Live
1. Avvia VSCode in modalità debug
2. Usa `pnpm dev` in watch mode
3. I cambiamenti si riflettono in tempo reale

## 📦 Pubblicazione (Local-First)

### Test Locale
```bash
# Nel modulo Visix
pnpm build
pnpm link

# Nel progetto che usa Visix
pnpm link @jarvis/visix
```

### Verifica Bundle
```bash
# Analizza bundle
pnpm analyze

# Test in browser
pnpm serve
```

## 🐛 Debug

### Configurazione VSCode
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Visix",
  "skipFiles": ["<node_internals>/**"],
  "program": "${workspaceFolder}/src/visix/index.ts",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

### Logging
```typescript
import { debug } from '@jarvis/visix/debug';

debug.log('Metrica aggiornata', { metric });
```

## 🔄 CI/CD

### Workflow GitHub Actions
- Build su push
- Test automatici
- Analisi bundle
- Publish su registry privato

## 📚 Risorse

- [Documentazione API](API.md)
- [Esempi](examples/)
- [Changelog](CHANGELOG.md)

## 🤝 Contribuire

1. Fork repository
2. Crea branch feature
3. Commit changes
4. Push branch
5. Crea PR

## 📄 Licenza

MIT 