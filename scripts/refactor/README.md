# 🛠 Script di Refactoring per ChatMessage

Set di strumenti per convertire oggetti message raw in chiamate `createSafeMessage` e correggere eventuali problemi derivanti dal refactoring.

## 🔄 Processo di refactoring

1. **Analizza** lo stato attuale delle chiamate `createSafeMessage` nel codebase
   ```bash
   pnpm ts-node scripts/refactor/verify-safe-messages.ts
   ```

2. **Correggi** le chiamate nidificate 
   ```bash
   # Verifica le chiamate nidificate
   pnpm ts-node scripts/refactor/fix-nested-safe-message.ts --check

   # Applica le correzioni
   pnpm ts-node scripts/refactor/fix-nested-safe-message.ts
   ```

3. **Aggiungi** gli import mancanti
   ```bash
   # Verifica gli import mancanti
   pnpm ts-node scripts/refactor/add-missing-imports.ts --check

   # Aggiungi gli import mancanti
   pnpm ts-node scripts/refactor/add-missing-imports.ts
   ```

4. **Verifica** i tipi con TypeScript
   ```bash
   pnpm tsc --noEmit
   ```

5. **Previeni** regressioni future con il plugin ESLint
   ```bash
   # Installa il plugin
   pnpm add -D ./scripts/refactor/eslint-plugin-safe-message
   
   # Aggiungi al tuo .eslintrc.js
   # {
   #   plugins: ['safe-message'],
   #   rules: {
   #     'safe-message/use-safe-message': 'error'
   #   }
   # }
   ```

6. **Genera** report delle modifiche (opzionale)
   ```bash
   # Genera report JSON e CSV
   node scripts/refactor/dashboard/generate-report.js
   ```

## 🔍 Lavorare su singole cartelle

Puoi specificare una cartella specifica come parametro per tutti gli script:

```bash
# Analizza solo la cartella src/api
pnpm ts-node scripts/refactor/verify-safe-messages.ts src/api

# Correggi le chiamate nidificate nella cartella test
pnpm ts-node scripts/refactor/fix-nested-safe-message.ts test

# Aggiungi gli import mancanti nella cartella src/webview
pnpm ts-node scripts/refactor/add-missing-imports.ts src/webview
```

## 🩹 Problemi comuni e soluzioni

### 1. Chiamate nidificate a createSafeMessage

**Problema**:
```ts
createSafeMessage(createSafeMessage({role: 'user', content: 'Hello'}))
```

**Soluzione**:
```ts
createSafeMessage({role: 'user', content: 'Hello'})
```

### 2. Import mancante

**Problema**:
```ts
// Nessun import per createSafeMessage
const message = createSafeMessage({role: 'user', content: 'Hello'});
```

**Soluzione**:
```ts
import { createSafeMessage } from "../shared/types/message";
const message = createSafeMessage({role: 'user', content: 'Hello'});
```

### 3. Formato oggetto errato

**Problema**:
```ts
createSafeMessage('user', 'Hello')
```

**Soluzione**:
```ts
createSafeMessage({role: 'user', content: 'Hello'})
```

## 📋 Flusso completo di refactoring

```bash
# 1. Verifica lo stato attuale
pnpm ts-node scripts/refactor/verify-safe-messages.ts

# 2. Correggi le chiamate nidificate
pnpm ts-node scripts/refactor/fix-nested-safe-message.ts

# 3. Aggiungi gli import mancanti
pnpm ts-node scripts/refactor/add-missing-imports.ts

# 4. Verifica i tipi
pnpm tsc --noEmit

# 5. Installa il plugin ESLint
pnpm add -D ./scripts/refactor/eslint-plugin-safe-message

# 6. Genera report (opzionale)
node scripts/refactor/dashboard/generate-report.js

# 7. Esegui i test
pnpm test
```

## 📊 Plugin ESLint per validazione continua

Il plugin ESLint `eslint-plugin-safe-message` è incluso per prevenire regressioni future. Fornisce:

- ✅ Identificazione automatica di oggetti message raw
- ✅ Validazione delle chiamate a `createSafeMessage`
- ✅ Fix automatici per molti problemi comuni
- ✅ Integrazione completa con il workflow ESLint

Quando installato e configurato, il plugin blocca automaticamente:

- Chiamate nidificate a `createSafeMessage`
- Argomenti non validi (non oggetti o senza `role`/`content`)
- Oggetti message non wrappati da `createSafeMessage`

Vedi la [documentazione del plugin](./eslint-plugin-safe-message/README.md) per maggiori dettagli.

## 📈 Report e statistiche

Lo script di generazione report crea:

- Report JSON dettagliato con tutti i fix e gli errori
- Report CSV per analisi in Excel o altri strumenti
- Statistiche sui tipi di fix più comuni
- Elenco dei file più modificati

I report vengono salvati nella cartella `reports/` con timestamp.

## 🧠 Best Practices per ts-morph

Quando si lavora con ts-morph per la manipolazione dell'AST, è importante seguire queste linee guida:

### 1. Gestione dei nodi rimossi o dimenticati

Un errore comune è `Attempted to get information from a node that was removed or forgotten`. Per evitarlo:

```ts
// ❌ Rischioso
node.getExpression().getText(); // Può fallire se il nodo è stato dimenticato

// ✅ Sicuro
if (!node.wasForgotten()) {
  node.getExpression().getText();
}

// ✅ Ancora meglio, usa le utility
import { safeGetExpression } from './utils';
const expr = safeGetExpression(node);
if (expr) {
  // Usa expr in sicurezza
}
```

### 2. Line numbers corretti

ts-morph non ha il metodo `getLineNumber()`. Usa invece:

```ts
// ❌ Non esiste
sourceFile.getLineNumber(node.getStart());

// ✅ Corretto
const linePos = sourceFile.getLineAndColumnAtPos(node.getStart());
const lineNumber = linePos.line;

// ✅ O usa l'utility
import { safeGetLineNumber } from './utils';
const line = safeGetLineNumber(sourceFile, node);
```

### 3. Modifiche differite all'AST

Evita di modificare l'AST mentre lo stai attraversando:

```ts
// ❌ Rischioso durante l'attraversamento
for (const node of nodes) {
  node.replaceWithText(...); // Può invalidare altri nodi
}

// ✅ Sicuro: accumula le modifiche e applicale dopo
const changes = [];
for (const node of nodes) {
  changes.push({ node, newText: '...' });
}

// Applica le modifiche in ordine inverso per evitare invalidazioni
for (let i = changes.length - 1; i >= 0; i--) {
  if (!changes[i].node.wasForgotten()) {
    changes[i].node.replaceWithText(changes[i].newText);
  }
}
```

### 4. Utility di sicurezza

Usa le funzioni nell'utility file `scripts/refactor/utils.ts` per operazioni sicure:

- `safeGetText()`
- `safeIsKind()`
- `safeGetExpression()`
- `safeGetLineNumber()`
- `safeReplaceWithText()`
- `safeGetArguments()` 