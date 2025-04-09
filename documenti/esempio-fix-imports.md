# Guida all'Utilizzo dello Script fix-imports.ts

Questo documento illustra l'utilizzo dello script `fix-imports.ts` per correggere automaticamente le importazioni nei file TypeScript.

## Scopo dello Script

Lo script `fix-imports.ts` risolve diversi problemi comuni nelle importazioni:

1. Aggiunge l'estensione `.js` alle importazioni relative
2. Corregge la sintassi delle importazioni di tipo
3. Rimuove estensioni duplicate
4. Standardizza le importazioni secondo le best practice TypeScript

## Installazione e Configurazione

1. Installare le dipendenze necessarie:
   ```
   pnpm install
   ```

2. Compilare lo script TypeScript:
   ```
   pnpm tsc
   ```

## Utilizzo

Per eseguire lo script su un'intera directory:

```bash
node dist/scripts/fix-imports.js src/
```

Per eseguire lo script con opzioni aggiuntive:

```bash
node dist/scripts/fix-imports.js src/ --dry-run --verbose
```

### Opzioni disponibili

- `--dry-run`: Simula le modifiche senza applicarle
- `--verbose`: Mostra messaggi dettagliati durante l'esecuzione
- `--exclude`: Specifica directory da escludere (il valore predefinito è già configurato per node_modules, dist, etc.)

## Esempi Prima/Dopo

### Esempio 1: Aggiunta estensione .js a importazioni relative

**Prima:**
```typescript
import { Logger } from '../utils/logger';
import { readFile } from 'fs/promises';
import * as path from 'path';

// Altri import...
import { ChatMessage } from './types/chat';
```

**Dopo:**
```typescript
import { Logger } from '../utils/logger.js';
import { readFile } from 'fs/promises';
import * as path from 'path';

// Altri import...
import { ChatMessage } from './types/chat.js';
```

### Esempio 2: Correzione sintassi importazioni di tipo

**Prima:**
```typescript
import { UserSettings } from '../shared/types/user-settings';
import { WebviewMessage, ExtensionMessage } from '../types/webview';
```

**Dopo:**
```typescript
import type { UserSettings } from '../shared/types/user-settings.js';
import type { WebviewMessage, ExtensionMessage } from '../types/webview.js';
```

### Esempio 3: Rimozione estensioni duplicate

**Prima:**
```typescript
import { ApiConfiguration } from './api.types.js.js';
import { JarvisProvider } from '../core/webview/JarvisProvider.js.js';
```

**Dopo:**
```typescript
import { ApiConfiguration } from './api.types.js';
import { JarvisProvider } from '../core/webview/JarvisProvider.js';
```

### Esempio 4: Conversione importazioni di namespace in importazioni dirette

**Prima:**
```typescript
import * as fs from 'fs/promises';
const content = await fs.readFile('./file.txt', 'utf-8');
```

**Dopo:**
```typescript
import { readFile } from 'fs/promises';
const content = await readFile('./file.txt', 'utf-8');
```

## Risoluzione Problemi Comuni

### Il mio file non viene modificato

Verifica che:
- Il file abbia estensione `.ts` o `.tsx`
- Il percorso del file non sia escluso dai pattern di esclusione
- Il file non sia aperto e modificato in un altro editor

### Errori dopo la correzione

Se riscontri errori dopo aver eseguito lo script:
1. Verifica se le importazioni corrette risolvono correttamente i moduli
2. Controlla se è necessario aggiornare la configurazione TypeScript (tsconfig.json)
3. In rari casi, potrebbe essere necessario correggere manualmente alcune importazioni

## Best Practice

1. Esegui prima lo script in modalità `--dry-run` per verificare le modifiche proposte
2. Utilizza il controllo versione (git) per poter annullare le modifiche se necessario
3. Esegui lo script regolarmente durante lo sviluppo per mantenere coerenti tutte le importazioni

## Integrazione con il Workflow

Puoi integrare questo script nei pre-commit hook o nel processo CI/CD per garantire che tutte le importazioni seguano le convenzioni del progetto.

```json
// In package.json
{
  "scripts": {
    "fix-imports": "node dist/scripts/fix-imports.js src/",
    "lint": "eslint . && npm run fix-imports"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint"
    }
  }
}
``` 