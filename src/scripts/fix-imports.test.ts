import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { fixImportsInFile, getJsExtensionType, extractModulesFromImports } from './fix-imports';

// Mock delle funzioni di fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn(),
    stat: jest.fn()
  },
  existsSync: jest.fn()
}));

describe('fix-imports script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getJsExtensionType', () => {
    test('dovrebbe identificare correttamente i tipi di estensione', () => {
      expect(getJsExtensionType('tsconfig.json')).toBe('none');
      expect(getJsExtensionType('package.json')).toBe('none');
      expect(getJsExtensionType('src/components/Button.ts')).toBe('ts');
      expect(getJsExtensionType('src/components/Button.tsx')).toBe('tsx');
      expect(getJsExtensionType('src/components/Button.js')).toBe('js');
      expect(getJsExtensionType('src/components/Button.jsx')).toBe('jsx');
      expect(getJsExtensionType('src/components/Button.d.ts')).toBe('dts');
    });
  });

  describe('extractModulesFromImports', () => {
    test('dovrebbe estrarre correttamente i moduli da vari tipi di dichiarazioni di importazione', () => {
      const code = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as path from 'path';
        import type { User } from '../types/user';
        import('./dynamicModule').then(module => {});
        const fs = require('fs');
        export { default as Button } from './Button';
        export * from './utils';
      `;

      const result = extractModulesFromImports(code);
      
      expect(result).toHaveLength(7);
      expect(result).toContainEqual(expect.objectContaining({ name: 'react', isDynamicImport: false }));
      expect(result).toContainEqual(expect.objectContaining({ name: 'path', isDynamicImport: false }));
      expect(result).toContainEqual(expect.objectContaining({ name: '../types/user', isDynamicImport: false }));
      expect(result).toContainEqual(expect.objectContaining({ name: './dynamicModule', isDynamicImport: true }));
      expect(result).toContainEqual(expect.objectContaining({ name: 'fs', isDynamicImport: false }));
      expect(result).toContainEqual(expect.objectContaining({ name: './Button', isDynamicImport: false }));
      expect(result).toContainEqual(expect.objectContaining({ name: './utils', isDynamicImport: false }));
    });
  });

  describe('fixImportsInFile', () => {
    test('dovrebbe aggiungere .js alle importazioni relative in file TS/TSX', async () => {
      // Mock del contenuto del file
      const fileContent = `
        import { Component } from '../components/Component';
        import utils from './utils';
        import * as constants from '../constants';
        import type { User } from '../types/user';
        import React from 'react';
      `;
      
      // Mock per simulare che i file esistono
      (fs.promises.readFile as jest.Mock).mockResolvedValue(fileContent);
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        // Simuliamo che esistono solo file TS/TSX
        if (filePath.includes('components/Component.ts') || 
            filePath.includes('utils.ts') || 
            filePath.includes('constants.ts') || 
            filePath.includes('types/user.ts')) {
          return true;
        }
        return false;
      });
      
      (fs.promises.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false });
      
      const result = await fixImportsInFile('src/someFile.ts', {
        addJsExtension: true,
        removeJsExtension: false,
        fix: true,
        verbose: false,
        dry: false
      });
      
      expect(result.fixed).toBe(true);
      
      // Verifica che writeFile sia stato chiamato con le estensioni .js aggiunte
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import { Component } from '../components/Component.js';"),
        'utf8'
      );
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import utils from './utils.js';"),
        'utf8'
      );
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import * as constants from '../constants.js';"),
        'utf8'
      );
      
      // I tipi non dovrebbero avere estensione .js
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import type { User } from '../types/user';"),
        'utf8'
      );
      
      // Le importazioni di npm non dovrebbero essere modificate
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import React from 'react';"),
        'utf8'
      );
    });

    test('dovrebbe rimuovere .js dalle importazioni relative quando richiesto', async () => {
      // Mock del contenuto del file
      const fileContent = `
        import { Component } from '../components/Component.js';
        import utils from './utils.js';
        import React from 'react';
      `;
      
      (fs.promises.readFile as jest.Mock).mockResolvedValue(fileContent);
      
      const result = await fixImportsInFile('src/someFile.ts', {
        addJsExtension: false,
        removeJsExtension: true,
        fix: true,
        verbose: false,
        dry: false
      });
      
      expect(result.fixed).toBe(true);
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import { Component } from '../components/Component';"),
        'utf8'
      );
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import utils from './utils';"),
        'utf8'
      );
      
      // Le importazioni npm non dovrebbero essere modificate
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import React from 'react';"),
        'utf8'
      );
    });

    test('non dovrebbe modificare il file in modalità dry run', async () => {
      // Mock del contenuto del file
      const fileContent = `
        import { Component } from '../components/Component';
        import utils from './utils';
      `;
      
      (fs.promises.readFile as jest.Mock).mockResolvedValue(fileContent);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false });
      
      const result = await fixImportsInFile('src/someFile.ts', {
        addJsExtension: true,
        removeJsExtension: false,
        fix: true,
        verbose: false,
        dry: true
      });
      
      expect(result.fixed).toBe(true);
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    test('dovrebbe gestire correttamente i percorsi index', async () => {
      // Mock del contenuto del file
      const fileContent = `
        import { Button } from '../components';
        import { utils } from './utils/index';
      `;
      
      (fs.promises.readFile as jest.Mock).mockResolvedValue(fileContent);
      (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('components/index.ts') || 
            filePath.includes('utils/index.ts')) {
          return true;
        }
        return false;
      });
      
      (fs.promises.stat as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('components') || filePath.includes('utils')) {
          return Promise.resolve({ isDirectory: () => true });
        }
        return Promise.resolve({ isDirectory: () => false });
      });
      
      const result = await fixImportsInFile('src/someFile.ts', {
        addJsExtension: true,
        removeJsExtension: false,
        fix: true,
        verbose: false,
        dry: false
      });
      
      expect(result.fixed).toBe(true);
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import { Button } from '../components/index.js';"),
        'utf8'
      );
      
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        'src/someFile.ts',
        expect.stringContaining("import { utils } from './utils/index.js';"),
        'utf8'
      );
    });

    test('dovrebbe misurare correttamente il tempo di esecuzione', async () => {
      const performanceNowSpy = jest.spyOn(performance, 'now');
      performanceNowSpy.mockReturnValueOnce(0);
      performanceNowSpy.mockReturnValueOnce(100); // Simuliamo 100ms di esecuzione
      
      const fileContent = `import { Component } from '../components/Component';`;
      (fs.promises.readFile as jest.Mock).mockResolvedValue(fileContent);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false });
      
      const result = await fixImportsInFile('src/someFile.ts', {
        addJsExtension: true,
        removeJsExtension: false,
        fix: true,
        verbose: true,
        dry: false
      });
      
      expect(result.time).toBeGreaterThanOrEqual(0);
      performanceNowSpy.mockRestore();
    });
  });
}); 