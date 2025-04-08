# Guida: Test Jest per lo script fix-imports.ts

Questa guida descrive come implementare test unitari efficaci per lo script `fix-imports.ts` utilizzando Jest.

## Prerequisiti

- Jest installato nel progetto (`pnpm add -D jest ts-jest @types/jest`)
- Configurazione Jest per TypeScript (`jest.config.js`)
- Conoscenza base di Jest e test unitari

## Struttura dei test

I test per `fix-imports.ts` dovrebbero verificare:

1. **Parsing degli argomenti**: verifica che le opzioni della CLI vengano interpretate correttamente
2. **Rilevamento dei file**: verifica che lo script trovi correttamente i file da modificare
3. **Analisi delle importazioni**: verifica che vengano identificate correttamente le importazioni
4. **Trasformazione del codice**: verifica che le modifiche al codice siano corrette
5. **Gestione errori**: verifica che lo script gestisca correttamente scenari di errore

## Implementazione dei test

### 1. Creare il file di test

Creare un file `src/scripts/__tests__/fix-imports.test.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import * as fixImports from '../fix-imports';

// Mock del modulo fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
  },
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  statSync: jest.fn(),
  existsSync: jest.fn(),
}));

// Mock di console.log e console.error per i test
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Reset dei mock
  jest.clearAllMocks();
  // Sostituire console.log e console.error con mock
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Ripristinare console.log e console.error originali
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('fix-imports.ts', () => {
  // Test per parseArgs
  describe('parseArgs', () => {
    test('dovrebbe interpretare correttamente gli argomenti standard', () => {
      // Implementazione del test
    });

    test('dovrebbe riconoscere la modalità check', () => {
      // Implementazione del test
    });

    // Altri test per gli argomenti...
  });

  // Test per shouldProcessFile
  describe('shouldProcessFile', () => {
    test('dovrebbe accettare file .ts e .tsx', () => {
      // Implementazione del test
    });

    test('dovrebbe rifiutare file in node_modules', () => {
      // Implementazione del test
    });

    // Altri test per la selezione dei file...
  });

  // Test per processFile
  describe('processFile', () => {
    test('dovrebbe aggiungere estensione .js alle importazioni relative', async () => {
      // Mock di fs.promises.readFile
      (fs.promises.readFile as jest.Mock).mockResolvedValue(`
        import { something } from './module';
        import type { SomeType } from './types';
        import * as utils from '../utils';
      `);

      const filePath = 'src/example.ts';
      const result = await fixImports.processFile(filePath, { check: false, verbose: false });

      // Verifica che il codice sia stato trasformato correttamente
      expect(result.modified).toBe(true);
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining("import { something } from './module.js';"),
        'utf8'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining("import type { SomeType } from './types';"),
        'utf8'
      );
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining("import * as utils from '../utils.js';"),
        'utf8'
      );
    });

    test('non dovrebbe modificare importazioni da pacchetti', async () => {
      // Implementazione del test
    });

    test('non dovrebbe modificare importazioni di tipo', async () => {
      // Implementazione del test
    });

    // Altri test per la trasformazione del codice...
  });

  // Test per walkDir
  describe('walkDir', () => {
    test('dovrebbe processare tutti i file in una directory', async () => {
      // Mock di fs.promises.readdir e fs.promises.stat
      (fs.promises.readdir as jest.Mock).mockResolvedValue(['file1.ts', 'file2.tsx', 'subdir']);
      (fs.promises.stat as jest.Mock).mockImplementation((path) => {
        if (path.includes('subdir')) {
          return Promise.resolve({ isDirectory: () => true });
        }
        return Promise.resolve({ isDirectory: () => false });
      });

      // Mock processFile per verificare che venga chiamato correttamente
      const mockProcessFile = jest.spyOn(fixImports, 'processFile').mockResolvedValue({ modified: false });

      await fixImports.walkDir('src', { check: false, verbose: false });

      // Verifica che processFile sia stato chiamato per ogni file
      expect(mockProcessFile).toHaveBeenCalledTimes(2);
      expect(mockProcessFile).toHaveBeenCalledWith('src/file1.ts', { check: false, verbose: false });
      expect(mockProcessFile).toHaveBeenCalledWith('src/file2.tsx', { check: false, verbose: false });
    });

    // Altri test per walkDir...
  });

  // Test per il main
  describe('main', () => {
    test('dovrebbe processare correttamente i file specificati', async () => {
      // Mock di process.argv
      const originalArgv = process.argv;
      process.argv = ['node', 'fix-imports.ts', 'src/file.ts'];

      // Mock di fs.existsSync e fixImports.processFile
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
      const mockProcessFile = jest.spyOn(fixImports, 'processFile').mockResolvedValue({ modified: true });

      await fixImports.main();

      // Verifiche
      expect(mockProcessFile).toHaveBeenCalledWith('src/file.ts', expect.any(Object));
      
      // Ripristina process.argv
      process.argv = originalArgv;
    });

    // Altri test per il main...
  });
});
```

### 2. Esportare le funzioni necessarie

Per testare le funzioni interne, potrebbe essere necessario esportarle in `fix-imports.ts`:

```typescript
// Esporta le funzioni per i test
export function parseArgs(args: string[]): Options {
  // implementazione...
}

export function shouldProcessFile(filePath: string): boolean {
  // implementazione...
}

export async function processFile(filePath: string, options: Options): Promise<{ modified: boolean }> {
  // implementazione...
}

export async function walkDir(dirPath: string, options: Options): Promise<void> {
  // implementazione...
}

// Funzione principale resta non esportata o esportata come default
export async function main(): Promise<void> {
  // implementazione...
}

// Se lo script è eseguito direttamente, chiama main()
if (require.main === module) {
  main().catch((error) => {
    console.error('Errore:', error);
    process.exit(1);
  });
}
```

### 3. Casi di test specifici

Per testare in modo completo lo script, considera questi casi:

#### Importazioni per tipo
```typescript
test('dovrebbe ignorare le importazioni di tipo', async () => {
  (fs.promises.readFile as jest.Mock).mockResolvedValue(`
    import type { SomeType } from './types';
    import { type AnotherType } from './types';
  `);

  const filePath = 'src/example.ts';
  const result = await fixImports.processFile(filePath, { check: false, verbose: false });

  expect(result.modified).toBe(false); // Non dovrebbe modificare le importazioni di tipo
});
```

#### Modalità verifica (check)
```typescript
test('in modalità check non dovrebbe modificare i file', async () => {
  (fs.promises.readFile as jest.Mock).mockResolvedValue(`
    import { something } from './module';
  `);

  const filePath = 'src/example.ts';
  const result = await fixImports.processFile(filePath, { check: true, verbose: false });

  expect(result.modified).toBe(true); // Rileva che il file dovrebbe essere modificato
  expect(fs.promises.writeFile).not.toHaveBeenCalled(); // Ma non scrive il file
});
```

#### Importazioni già con estensione
```typescript
test('non dovrebbe modificare importazioni che hanno già l\'estensione .js', async () => {
  (fs.promises.readFile as jest.Mock).mockResolvedValue(`
    import { something } from './module.js';
  `);

  const filePath = 'src/example.ts';
  const result = await fixImports.processFile(filePath, { check: false, verbose: false });

  expect(result.modified).toBe(false);
});
```

### 4. Test di integrazione

Per test più completi, considera la creazione di test di integrazione con file temporanei reali:

```typescript
describe('Integrazione', () => {
  const tmpDir = path.join(__dirname, 'tmp-test-dir');
  const testFile = path.join(tmpDir, 'test.ts');

  beforeAll(() => {
    // Crea una directory temporanea e file di test
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    fs.writeFileSync(testFile, `
      import { something } from './module';
      import type { SomeType } from './types';
    `, 'utf8');
  });

  afterAll(() => {
    // Pulisci la directory temporanea
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(tmpDir)) {
      fs.rmdirSync(tmpDir, { recursive: true });
    }
  });

  test('dovrebbe modificare correttamente un file reale', async () => {
    // Ripristina fs reale per questo test
    jest.restoreAllMocks();
    
    // Esegui processFile su un file reale
    const result = await fixImports.processFile(testFile, { check: false, verbose: false });
    
    // Leggi il contenuto modificato
    const content = fs.readFileSync(testFile, 'utf8');
    
    expect(result.modified).toBe(true);
    expect(content).toContain("import { something } from './module.js';");
    expect(content).toContain("import type { SomeType } from './types';");
  });
});
```

## Esecuzione dei test

Aggiungi uno script nel `package.json`:

```json
{
  "scripts": {
    "test:fix-imports": "jest src/scripts/__tests__/fix-imports.test.ts",
    "test:coverage": "jest --coverage"
  }
}
```

Esegui i test con:

```bash
pnpm test:fix-imports
```

## Consigli aggiuntivi

1. **Mock selettivi**: Puoi scegliere quali funzioni moccare e quali utilizzare realmente (utile per test di integrazione).

2. **Test parametrizzati**: Usa `test.each` per testare molti casi con un'unica implementazione:

```typescript
test.each([
  ['./module', './module.js'],
  ['../utils', '../utils.js'],
  ['./component', './component.js'],
])('dovrebbe convertire %s in %s', async (input, expected) => {
  (fs.promises.readFile as jest.Mock).mockResolvedValue(`import { something } from '${input}';`);
  
  const filePath = 'src/example.ts';
  await fixImports.processFile(filePath, { check: false, verbose: false });
  
  expect(fs.promises.writeFile).toHaveBeenCalledWith(
    filePath,
    expect.stringContaining(`import { something } from '${expected}';`),
    'utf8'
  );
});
```

3. **Snapshot testing**: Utile per verificare che il codice trasformato corrisponda esattamente alle aspettative:

```typescript
test('dovrebbe generare il codice corretto (snapshot)', async () => {
  (fs.promises.readFile as jest.Mock).mockResolvedValue(`
    import { something } from './module';
    import type { SomeType } from './types';
    import * as utils from '../utils';
  `);

  const filePath = 'src/example.ts';
  await fixImports.processFile(filePath, { check: false, verbose: false });
  
  // Estrai il codice trasformato dalla chiamata a writeFile
  const transformedCode = (fs.promises.writeFile as jest.Mock).mock.calls[0][1];
  
  // Confronta con lo snapshot
  expect(transformedCode).toMatchSnapshot();
});
```

## Conclusione

Con questi test, puoi garantire che lo script `fix-imports.ts` funzioni correttamente per tutti i casi d'uso previsti. I test aiutano a prevenire regressioni quando lo script viene modificato e documentano il suo comportamento atteso.

Ricorda di aggiornare i test quando aggiungi nuove funzionalità o modifichi il comportamento esistente dello script. 