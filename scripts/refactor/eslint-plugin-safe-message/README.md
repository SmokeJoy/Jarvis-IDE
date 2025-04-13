# eslint-plugin-safe-message

Plugin ESLint per garantire l'uso corretto di `createSafeMessage` nel codebase.

## Installazione

```bash
# npm
npm install --save-dev eslint-plugin-safe-message

# pnpm 
pnpm add -D eslint-plugin-safe-message

# yarn
yarn add -D eslint-plugin-safe-message
```

## Configurazione

Aggiorna il tuo file `.eslintrc.js`:

```js
module.exports = {
  plugins: [
    // ... altri plugin
    'safe-message'
  ],
  rules: {
    // ... altre regole
    'safe-message/use-safe-message': 'error'
  }
};
```

Oppure estendi direttamente la configurazione raccomandata:

```js
module.exports = {
  extends: [
    // ... altre estensioni
    'plugin:safe-message/recommended'
  ]
};
```

## Regole

### `safe-message/use-safe-message`

Questa regola garantisce l'uso corretto di `createSafeMessage`:

- ✅ Impedisce chiamate nidificate (`createSafeMessage(createSafeMessage({...}))`)
- ✅ Verifica che l'argomento sia un oggetto
- ✅ Assicura che l'oggetto abbia le proprietà `role` e `content`
- ✅ Identifica oggetti message raw che dovrebbero usare `createSafeMessage`

### Esempi

#### ❌ Non valido

```js
// Chiamata nidificata
createSafeMessage(createSafeMessage({role: 'user', content: 'Hello'}))

// Argomento non oggetto
createSafeMessage('user', 'Hello')

// Mancano proprietà obbligatorie
createSafeMessage({role: 'user'})
createSafeMessage({content: 'Hello'})

// Oggetto message raw
const message = {role: 'user', content: 'Hello'};
```

#### ✅ Valido

```js
// Uso corretto
createSafeMessage({role: 'user', content: 'Hello'})
createSafeMessage({role: 'assistant', content: 'Hi there', timestamp: Date.now()})
```

## Opzioni di Fix Automatico

La regola supporta il fix automatico (`--fix`) per:

- Rimuovere le chiamate nidificate
- Convertire oggetti message raw in chiamate a `createSafeMessage`

Per utilizzare i fix automatici:

```bash
eslint --fix src/
``` 