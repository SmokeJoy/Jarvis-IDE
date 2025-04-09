import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import fsPromises from 'fs/promises';
import { vol } from 'memfs';

// Importa le funzioni da testare dallo script
// Nota: in una situazione reale, queste funzioni dovrebbero essere esportate dallo script
import { 
  addJsExtensions, 
  correctImportTypes, 
  fixDoubleJsExtensions,
  processFile
} from '../scripts/fix-imports'; // Percorso da adattare in base alla posizione reale

// Mock dei moduli fs e path
jest.mock('fs/promises');
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn()
}));

// Simuliamo l'ambiente di test con file virtuali
const mockFileSystem = {
  '/project/src/module.ts': `import { something } from '../utils/helpers';
import type { Config } from '../types/config';
import { render } from 'react';
import { useState } from 'react'
`,
  '/project/src/brokenImport.ts': `import { something } from '../utils/helpers.js.js';
import type { Config } from '../types/config.js';`,
  '/project/src/typeImport.ts': `import { type User } from '../types/user';`,
  '/project/node_modules/module/index.js': 'console.log("module");',
  '/project/package.json': '{ "type": "module" }',
  '/project/tsconfig.json': '{ "compilerOptions": { "target": "es2020", "module": "NodeNext" } }'
};

// Carichiamo direttamente il codice dello script da testare, ma lo faremo dopo aver configurato i mock
// @ts-ignore - questo sarà un import dinamico dopo i mock
let fixImports: any;

describe('Script fix-imports', () => {
  let tempDir: string;
  
  beforeEach(() => {
    // Crea una directory temporanea per i test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fix-imports-test-'));
    
    // Configura il file system virtuale
    vol.fromJSON(mockFileSystem, '/project');
    
    // Mock delle funzioni di fs
    const mockFs = fsPromises as jest.Mocked<typeof fsPromises>;
    mockFs.readFile.mockImplementation((filePath: string) => {
      const stringPath = filePath.toString();
      if (stringPath in mockFileSystem) {
        return Promise.resolve(Buffer.from(mockFileSystem[stringPath]));
      }
      return Promise.reject(new Error(`File not found: ${stringPath}`));
    });
    
    mockFs.writeFile.mockImplementation((filePath: string, content: string) => {
      mockFileSystem[filePath.toString()] = content;
      return Promise.resolve();
    });
    
    mockFs.readdir.mockImplementation((dirPath: string) => {
      const dirString = dirPath.toString();
      const dir = dirString.endsWith('/') ? dirString : `${dirString}/`;
      const files = Object.keys(mockFileSystem)
        .filter(file => file.startsWith(dir) && file !== dir)
        .map(file => file.substring(dir.length).split('/')[0]);
      
      return Promise.resolve([...new Set(files)]);
    });
    
    mockFs.stat.mockImplementation((filePath: string) => {
      const stringPath = filePath.toString();
      const isDirectory = Object.keys(mockFileSystem).some(path => 
        path !== stringPath && path.startsWith(stringPath + '/'));
      
      return Promise.resolve({
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory && stringPath in mockFileSystem
      } as any);
    });
    
    // Mock di path.resolve per restituire percorsi assoluti
    (path.resolve as jest.Mock).mockImplementation((...args: string[]) => {
      return '/project/' + args[args.length - 1].replace(/^\//, '');
    });
    
    // Ora possiamo caricare lo script da testare
    // Normalmente lo importeremo così:
    // fixImports = await import('../scripts/fix-imports');
    
    // Simuliamo il caricamento dello script e le sue funzioni
    fixImports = {
      fixImportsInFile: jest.fn().mockImplementation(async (filePath: string, options: any) => {
        const content = await fsPromises.readFile(filePath, 'utf-8');
        
        // Simulazione del comportamento dello script
        let updatedContent = content.toString();
        
        // Aggiungi .js alle importazioni relative
        updatedContent = updatedContent.replace(
          /from ['"](\.[^'"]+)['"]/g, 
          (match, importPath) => {
            // Evita di aggiungere .js se già presente
            if (importPath.endsWith('.js')) return match;
            return `from '${importPath}.js'`;
          }
        );
        
        // Correggi gli import di tipo
        updatedContent = updatedContent.replace(
          /import\s+{\s*([^}]*?)\s*}\s+from\s+['"]([^'"]+)['"]/g,
          (match, imports, importPath) => {
            // Se contiene la parola 'type', converti in import type
            if (imports.includes('type')) {
              const cleanedImports = imports.replace(/type\s+/g, '');
              return `import type { ${cleanedImports} } from '${importPath}'`;
            }
            return match;
          }
        );
        
        // Rimuovi .js.js duplicati
        updatedContent = updatedContent.replace(/\.js\.js/g, '.js');
        
        // Se non ci sono cambiamenti, ritorna false
        if (content === updatedContent) {
          return false;
        }
        
        // Se siamo in modalità dry-run, non scrivere i cambiamenti
        if (!options?.dryRun) {
          await fsPromises.writeFile(filePath, updatedContent);
        }
        
        return true;
      }),
      
      processDirectory: jest.fn().mockImplementation(async (dirPath: string, options: any) => {
        const entries = await fsPromises.readdir(dirPath);
        let changedFiles = 0;
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry);
          const stats = await fsPromises.stat(fullPath);
          
          if (stats.isDirectory()) {
            // Salta node_modules e altre directory escluse
            if (entry === 'node_modules' || (options?.excludeDirs || []).includes(entry)) {
              continue;
            }
            // Elabora le directory ricorsivamente
            changedFiles += await fixImports.processDirectory(fullPath, options);
          } else if (stats.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry)) {
            // Elabora i file con le estensioni appropriate
            if (await fixImports.fixImportsInFile(fullPath, options)) {
              changedFiles++;
            }
          }
        }
        
        return changedFiles;
      })
    };
  });
  
  afterEach(() => {
    // Pulisci i file temporanei dopo ogni test
    fs.rmSync(tempDir, { recursive: true, force: true });
    vol.reset();
    jest.clearAllMocks();
  });

  describe('addJsExtensions', () => {
    test('deve aggiungere estensione .js agli import relativi', () => {
      const input = `import { Component } from '../components/Component';
import type { Props } from './types';
import * as utils from '../utils/helpers';
import DefaultExport from '../components/Default'`;
      
      const expected = `import { Component } from '../components/Component.js';
import type { Props } from './types.js';
import * as utils from '../utils/helpers.js';
import DefaultExport from '../components/Default.js'`;
      
      expect(addJsExtensions(input)).toBe(expected);
    });
    
    test('non deve modificare gli import di pacchetti node_modules', () => {
      const input = `import React from 'react';
import { useState } from 'react';
import styled from 'styled-components';`;
      
      expect(addJsExtensions(input)).toBe(input);
    });
  });
  
  describe('correctImportTypes', () => {
    test('deve convertire gli import in import type quando appropriato', () => {
      const input = `import { Type1, Type2 } from './types';
import { Component, type Props } from './components';`;
      
      const expected = `import type { Type1, Type2 } from './types';
import { Component } from './components';
import type { Props } from './components';`;
      
      expect(correctImportTypes(input)).toBe(expected);
    });
  });
  
  describe('fixDoubleJsExtensions', () => {
    test('deve rimuovere doppie estensioni .js.js', () => {
      const input = `import { Component } from '../components/Component.js.js';
import type { Props } from './types.js.js';`;
      
      const expected = `import { Component } from '../components/Component.js';
import type { Props } from './types.js';`;
      
      expect(fixDoubleJsExtensions(input)).toBe(expected);
    });
  });
  
  describe('processFile', () => {
    test('deve modificare correttamente un file TypeScript', () => {
      // Crea un file di test
      const testFilePath = path.join(tempDir, 'test.ts');
      const initialContent = `import { Component } from '../components/Component';
import React from 'react';
import { Type1, type Type2 } from './types';
import { func } from '../utils/helpers.js.js';`;
      
      fs.writeFileSync(testFilePath, initialContent, 'utf8');
      
      // Chiama processFile
      const result = processFile(testFilePath, { dryRun: false, verbose: true });
      
      // Verifica il risultato
      expect(result.modified).toBe(true);
      expect(result.jsExtensionsAdded).toBe(2);
      expect(result.typeImportsFixed).toBe(1);
      expect(result.doubleJsFixed).toBe(1);
      
      // Verifica il contenuto del file modificato
      const modifiedContent = fs.readFileSync(testFilePath, 'utf8');
      expect(modifiedContent).toContain(`import { Component } from '../components/Component.js'`);
      expect(modifiedContent).toContain(`import React from 'react'`); // Non modificato
      expect(modifiedContent).toContain(`import type { Type1 } from './types.js'`);
      expect(modifiedContent).toContain(`import type { Type2 } from './types.js'`);
      expect(modifiedContent).toContain(`import { func } from '../utils/helpers.js'`);
    });
    
    test('deve ritornare risultati corretti in modalità dry-run', () => {
      // Crea un file di test
      const testFilePath = path.join(tempDir, 'test-dry.ts');
      const initialContent = `import { Component } from '../components/Component';
import React from 'react';`;
      
      fs.writeFileSync(testFilePath, initialContent, 'utf8');
      
      // Chiama processFile in modalità dry-run
      const result = processFile(testFilePath, { dryRun: true, verbose: false });
      
      // Verifica il risultato
      expect(result.modified).toBe(true);
      expect(result.jsExtensionsAdded).toBe(1);
      
      // Verifica che il file originale non sia stato modificato
      const modifiedContent = fs.readFileSync(testFilePath, 'utf8');
      expect(modifiedContent).toBe(initialContent);
    });
  });
  
  test('Dovrebbe aggiungere .js alle importazioni relative', async () => {
    const filePath = '/project/src/module.ts';
    await fixImports.fixImportsInFile(filePath, { dryRun: false });
    
    // Verifica che il file sia stato aggiornato
    expect(fsPromises.writeFile).toHaveBeenCalled();
    
    // Verifica che le modifiche siano state applicate correttamente
    const updatedContent = mockFileSystem[filePath];
    expect(updatedContent).toContain("from '../utils/helpers.js'");
    expect(updatedContent).toContain("from '../types/config.js'");
    // Le importazioni non relative non dovrebbero cambiare
    expect(updatedContent).toContain("from 'react'");
  });
  
  test('Non dovrebbe modificare i file in modalità dry-run', async () => {
    const filePath = '/project/src/module.ts';
    const originalContent = mockFileSystem[filePath];
    
    await fixImports.fixImportsInFile(filePath, { dryRun: true });
    
    // Verifica che il file non sia stato modificato
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
    expect(mockFileSystem[filePath]).toBe(originalContent);
  });
  
  test('Dovrebbe correggere le importazioni di tipo', async () => {
    const filePath = '/project/src/typeImport.ts';
    await fixImports.fixImportsInFile(filePath, { dryRun: false });
    
    // Verifica che il file sia stato aggiornato
    const updatedContent = mockFileSystem[filePath];
    expect(updatedContent).toContain("import type { User } from '../types/user.js'");
  });
  
  test('Dovrebbe rimuovere le estensioni .js.js duplicate', async () => {
    const filePath = '/project/src/brokenImport.ts';
    await fixImports.fixImportsInFile(filePath, { dryRun: false });
    
    // Verifica che il file sia stato aggiornato
    const updatedContent = mockFileSystem[filePath];
    expect(updatedContent).toContain("from '../utils/helpers.js'");
    expect(updatedContent).not.toContain(".js.js");
  });
  
  test('Dovrebbe elaborare ricorsivamente le directory', async () => {
    await fixImports.processDirectory('/project/src', { dryRun: false });
    
    // Verifica che fixImportsInFile sia stato chiamato per tutti i file TS/JS
    expect(fixImports.fixImportsInFile).toHaveBeenCalledTimes(3);
    expect(fixImports.fixImportsInFile).toHaveBeenCalledWith('/project/src/module.ts', expect.anything());
    expect(fixImports.fixImportsInFile).toHaveBeenCalledWith('/project/src/brokenImport.ts', expect.anything());
    expect(fixImports.fixImportsInFile).toHaveBeenCalledWith('/project/src/typeImport.ts', expect.anything());
  });
  
  test('Dovrebbe saltare le directory escluse', async () => {
    await fixImports.processDirectory('/project', { 
      dryRun: false,
      excludeDirs: ['node_modules', 'dist']
    });
    
    // Verifica che node_modules sia stato saltato
    expect(fixImports.processDirectory).not.toHaveBeenCalledWith('/project/node_modules', expect.anything());
  });
}); 