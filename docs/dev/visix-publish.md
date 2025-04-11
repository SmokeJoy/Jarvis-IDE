# Pubblicazione Modulo Visix

## 🚀 Setup Registry Privato

### Prerequisiti
- Node.js 18+
- pnpm 8+
- Verdaccio (registry privato)

### Installazione Verdaccio
```bash
# Installazione globale
pnpm add -g verdaccio

# Avvio registry
verdaccio
```

### Configurazione NPM
```bash
# ~/.npmrc
registry=http://localhost:4873/
```

## 📦 Processo di Pubblicazione

### 1. Build
```bash
# Nel modulo Visix
pnpm build
```

### 2. Pubblicazione
```bash
# Login al registry
pnpm login --registry http://localhost:4873/

# Pubblicazione
pnpm publish --registry http://localhost:4873/
```

### 3. Verifica
```bash
# In un progetto test
pnpm add @jarvis/visix --registry http://localhost:4873/
```

## 🔄 Versioning

### Regole Semantiche
- `major`: Breaking changes
- `minor`: Nuove feature
- `patch`: Bug fixes

### Esempi
```bash
# Major release
pnpm version major

# Minor release
pnpm version minor

# Patch release
pnpm version patch
```

## 🧪 Test Locale

### Link Simbolico
```bash
# Nel modulo Visix
pnpm link

# Nel progetto test
pnpm link @jarvis/visix
```

### Verifica Bundle
```bash
# Analisi bundle
pnpm analyze

# Test in browser
pnpm serve
```

## 🔒 Sicurezza

### NPM Token
```bash
# Genera token
npm token create

# Configura in .npmrc
//registry.npmjs.org/:_authToken=YOUR_TOKEN
```

### Scopes
```json
{
  "name": "@jarvis/visix",
  "publishConfig": {
    "access": "restricted"
  }
}
```

## 📚 Risorse

- [Documentazione Verdaccio](https://verdaccio.org/docs/en/installation)
- [NPM Publishing](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)

## 🤝 Contribuire

1. Fork repository
2. Crea branch feature
3. Commit changes
4. Push branch
5. Crea PR

## 📄 Licenza

MIT 