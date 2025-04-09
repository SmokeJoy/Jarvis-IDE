# Guida: Test Jest per fix-imports.ts

Questo documento descrive come implementare test di unità con Jest per lo script `fix-imports.ts`.

## Requisiti

- Jest
- ts-jest (per eseguire test di TypeScript con Jest)
- Node.js fs mocks per testare le operazioni sui file

## Struttura del test

Il test dovrebbe verificare che lo script:

1. Identifichi correttamente le importazioni relative senza estensione `.js`
2. Aggiunga l'estensione `.js` alle importazioni appropriate
3. Non modifichi importazioni che non dovrebbero essere modificate
4. Gestisca correttamente le importazioni di tipo
5. Corregga i percorsi con doppia estensione `.js.js`

## Implementazione

Creare un file `fix-imports.test.ts` nella directory `src/scripts/__tests__/`:

```typescript
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Mockare i moduli fs e path
jest.mock('fs');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn().mockImplementation((...args) => args.join('/'))
}));

// Import delle funzioni da testare
// Nota: potrebbe essere necessario esportare le funzioni interne dello script per testarle
// Altrimenti, copia la logica rilevante in un modulo separato per il testing
import {
  processFile,
  parseArgs,
  walkDir
} from '../fix-imports';

// Mock delle funzioni promisify
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockReaddir = jest.fn();
const mockStat = jest.fn();

// Setup dei mock
jest.mock('util', () => ({
  promisify: jest.fn((fn) => {
    if (fn === fs.readFile) return mockReadFile;
    if (fn === fs.writeFile) return mockWriteFile;
    if (fn === fs.readdir) return mockReaddir;
    if (fn === fs.stat) return mockStat;
    return fn;
  })
}));

describe('fix-imports', () => {
  beforeEach(() => {
    // Reset dei mock
    jest.clearAllMocks();
  });

  describe('parseArgs', () => {
    test('dovrebbe utilizzare i valori predefiniti quando non ci sono argomenti', () => {
      // Configurare gli argomenti del processo
      process.argv = ['node', 'fix-imports.ts'];
      
      const options = parseArgs();
      
      expect(options.dryRun).toBe(false);
      expect(options.rootDir).toBe('./src');
      expect(options.extensions).toEqual(['.ts', '.tsx']);
      expect(options.excludeDirs).toContain('node_modules');
      expect(options.verbose).toBe(false);
      expect(options.fixDoubleJs).toBe(true);
    });

    test('dovrebbe impostare dryRun quando specificato', () => {
      process.argv = ['node', 'fix-imports.ts', '--dry-run'];
      
      const options = parseArgs();
      
      expect(options.dryRun).toBe(true);
    });

    test('dovrebbe utilizzare la directory personalizzata quando specificato', () => {
      process.argv = ['node', 'fix-imports.ts', '--dir=./libs'];
      
      const options = parseArgs();
      
      expect(options.rootDir).toBe('./libs');
    });
  });

  describe('processFile', () => {
    const options = {
      dryRun: false,
      rootDir: './src',
      extensions: ['.ts', '.tsx'],
      excludeDirs: ['node_modules'],
      verbose: false,
      fixDoubleJs: true
    };

    test('dovrebbe aggiungere .js alle importazioni relative senza estensione', async () => {
      // Mock del contenuto del file con importazioni relative senza estensione
      const fileContent = `
        import { Component } from './components/Button';
        import type { Props } from '../types/component-types';
        import styles from './styles/main.css';
        import React from 'react';
      `;
      
      const expectedContent = `
        import { Component } from './components/Button.js';
        import type { Props } from '../types/component-types.js';
        import styles from './styles/main.css';
        import React from 'react';
      `;
      
      mockReadFile.mockResolvedValue(fileContent);
      mockWriteFile.mockResolvedValue(undefined);
      
      const result = await processFile('src/example.ts', options);
      
      expect(mockWriteFile).toHaveBeenCalledWith('src/example.ts', expectedContent, 'utf-8');
      expect(result.modified).toBe(true);
      expect(result.importFixCount).toBe(2);
    });

    test('non dovrebbe modificare importazioni assolute', async () => {
      const fileContent = `
        import React from 'react';
        import { useState } from 'react';
      `;
      
      mockReadFile.mockResolvedValue(fileContent);
      
      const result = await processFile('src/example.ts', options);
      
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(result.modified).toBe(false);
      expect(result.importFixCount).toBe(0);
    });

    test('dovrebbe correggere importazioni con doppio .js.js', async () => {
      const fileContent = `
        import { Component } from './components/Button.js.js';
      `;
      
      const expectedContent = `
        import { Component } from './components/Button.js';
      `;
      
      mockReadFile.mockResolvedValue(fileContent);
      mockWriteFile.mockResolvedValue(undefined);
      
      const result = await processFile('src/example.ts', options);
      
      expect(mockWriteFile).toHaveBeenCalledWith('src/example.ts', expectedContent, 'utf-8');
      expect(result.modified).toBe(true);
      expect(result.doubleJsFixCount).toBe(1);
    });

    test('non dovrebbe aggiungere .js alle importazioni non-JS', async () => {
      const fileContent = `
        import styles from './styles.css';
        import data from './data.json';
        import icon from './icon.svg';
      `;
      
      mockReadFile.mockResolvedValue(fileContent);
      
      const result = await processFile('src/example.ts', options);
      
      expect(mockWriteFile).not.toHaveBeenCalled();
      expect(result.modified).toBe(false);
      expect(result.importFixCount).toBe(0);
    });

    test('dovrebbe trasformare importazioni normali in importazioni di tipo quando appropriato', async () => {
      const fileContent = `
        import { UserType, ProfileInterface } from './types';
      `;
      
      const expectedContent = `
        import type { UserType, ProfileInterface } from './types.js';
      `;
      
      mockReadFile.mockResolvedValue(fileContent);
      mockWriteFile.mockResolvedValue(undefined);
      
      const result = await processFile('src/example.ts', options);
      
      expect(mockWriteFile).toHaveBeenCalledWith('src/example.ts', expectedContent, 'utf-8');
      expect(result.modified).toBe(true);
      expect(result.importFixCount).toBe(1);
      expect(result.typeImportFixCount).toBe(1);
    });
  });

  describe('walkDir', () => {
    const options = {
      dryRun: false,
      rootDir: './src',
      extensions: ['.ts', '.tsx'],
      excludeDirs: ['node_modules', 'dist'],
      verbose: false,
      fixDoubleJs: true
    };

    test('dovrebbe scansionare ricorsivamente i file con le estensioni corrette', async () => {
      // Configurare il mock di readdir per restituire un elenco di file e directory
      mockReaddir.mockResolvedValueOnce(['file1.ts', 'file2.js', 'subdir']);
      mockReaddir.mockResolvedValueOnce(['file3.tsx', 'file4.json']);
      
      // Configurare il mock di stat per identificare file e directory
      mockStat.mockImplementation((path) => {
        if (path.includes('subdir')) {
          return Promise.resolve({ isDirectory: () => true });
        }
        return Promise.resolve({ isDirectory: () => false });
      });
      
      const files = await walkDir('./src', options);
      
      expect(files).toEqual(['src/file1.ts', 'src/subdir/file3.tsx']);
      expect(mockReaddir).toHaveBeenCalledWith('./src');
      expect(mockReaddir).toHaveBeenCalledWith('src/subdir');
    });

    test('dovrebbe escludere le directory specificate', async () => {
      mockReaddir.mockResolvedValueOnce(['file1.ts', 'node_modules', 'dist', 'valid_dir']);
      mockReaddir.mockResolvedValueOnce(['file2.tsx']);
      
      mockStat.mockImplementation((path) => {
        if (path.includes('node_modules') || path.includes('dist') || path.includes('valid_dir')) {
          return Promise.resolve({ isDirectory: () => true });
        }
        return Promise.resolve({ isDirectory: () => false });
      });
      
      const files = await walkDir('./src', options);
      
      expect(files).toEqual(['src/file1.ts', 'src/valid_dir/file2.tsx']);
      expect(mockReaddir).not.toHaveBeenCalledWith('src/node_modules');
      expect(mockReaddir).not.toHaveBeenCalledWith('src/dist');
    });
  });
});
```

## Note implementative

### Problemi da considerare

1. **Esportazione delle funzioni**: lo script attuale potrebbe non esportare le funzioni interne, rendendo difficile importarle direttamente per i test. Opzioni:
   - Modificare lo script per esportare le funzioni
   - Implementare una versione più testabile dello script che espone le funzioni necessarie
   - Estrarre la logica principale in moduli separati che possono essere importati sia dallo script principale che dai test

2. **Side effects**: lo script esegue operazioni di I/O sui file. Nel test dovremo mockare queste operazioni per:
   - Evitare di modificare file reali durante i test
   - Controllare ciò che le funzioni "leggerebbero" dai file
   - Verificare che le scritture su file siano corrette

### Come eseguire i test

1. Assicurarsi che Jest sia configurato per TypeScript nel `package.json`:

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    "collectCoverage": true,
    "coverageReporters": ["text", "lcov"],
    "coverageDirectory": "coverage"
  }
}
```

2. Eseguire i test con:

```bash
pnpm jest src/scripts/__tests__/fix-imports.test.ts
```

## Test di integrazione

Oltre ai test di unità, considera l'aggiunta di test di integrazione che verifichino lo script su file reali in una directory temporanea:

```typescript
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

describe('fix-imports integration tests', () => {
  const tempDir = path.join(process.cwd(), 'temp-test-' + uuidv4());
  const scriptPath = path.join(process.cwd(), 'src/scripts/fix-imports.ts');
  
  beforeAll(() => {
    // Creare una directory temporanea con file di test
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Creare alcuni file di test con importazioni da correggere
    fs.writeFileSync(
      path.join(tempDir, 'test-file.ts'),
      `import { Component } from './components/Button';\nimport { useState } from 'react';`
    );
    
    // Creare una sottodirectory con altri file
    fs.mkdirSync(path.join(tempDir, 'components'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'components/Button.ts'),
      `import { Props } from '../types';\nexport const Button = () => {};`
    );
  });
  
  afterAll(() => {
    // Pulire la directory temporanea dopo i test
    fs.removeSync(tempDir);
  });
  
  test('dovrebbe correggere le importazioni quando eseguito su una directory', () => {
    // Eseguire lo script sulla directory temporanea
    execSync(`ts-node ${scriptPath} --dir=${tempDir}`);
    
    // Verificare che le importazioni siano state corrette
    const testFileContent = fs.readFileSync(path.join(tempDir, 'test-file.ts'), 'utf-8');
    expect(testFileContent).toContain(`import { Component } from './components/Button.js'`);
    expect(testFileContent).toContain(`import { useState } from 'react'`);
    
    const buttonContent = fs.readFileSync(path.join(tempDir, 'components/Button.ts'), 'utf-8');
    expect(buttonContent).toContain(`import { Props } from '../types.js'`);
  });
});
```

## Conclusione

Questi test assicurano che lo script `fix-imports.ts` funzioni correttamente in diverse situazioni. Aggiungere test di unità e integrazione aumenterà la manutenibilità e l'affidabilità dello script, rendendo più facile rilevare regressioni durante lo sviluppo futuro. 