import fs from 'fs/promises';
import path from 'path';
import { fixImports } from '../../src/scripts/fix-imports';
import { vol } from 'memfs';

// Mock del file system usando memfs
jest.mock('fs/promises');
jest.mock('fs', () => require('memfs').fs);

describe('fix-imports script', () => {
  beforeEach(() => {
    // Reset del file system virtuale prima di ogni test
    vol.reset();
  });

  test('aggiunge estensione .js alle importazioni relative', async () => {
    const testFile = {
      '/test/file.ts': `
        import { Logger } from '../utils/logger';
        import { readFile } from 'fs/promises';
        import * as path from 'path';
        
        // Codice...
        import { ChatMessage } from './types/chat';
      `
    };
    
    vol.fromJSON(testFile);
    
    await fixImports('/test', { dryRun: false, verbose: false });
    
    const result = await fs.readFile('/test/file.ts', 'utf-8');
    expect(result).toContain("import { Logger } from '../utils/logger.js';");
    expect(result).toContain("import { ChatMessage } from './types/chat.js';");
    // Le importazioni da pacchetti non dovrebbero essere modificate
    expect(result).toContain("import { readFile } from 'fs/promises';");
    expect(result).toContain("import * as path from 'path';");
  });

  test('corregge la sintassi delle importazioni di tipo', async () => {
    const testFile = {
      '/test/file.ts': `
        // Importazioni di solo tipo
        import { UserSettings } from '../shared/types/user-settings';
        import { WebviewMessage, ExtensionMessage } from '../types/webview';
        
        // Dichiarazione di una variabile di tipo UserSettings
        const settings: UserSettings = {};
        
        // Funzione che accetta messaggi
        function handleMessage(message: WebviewMessage): ExtensionMessage {
          return { type: 'response' };
        }
      `
    };
    
    vol.fromJSON(testFile);
    
    await fixImports('/test', { dryRun: false, verbose: false });
    
    const result = await fs.readFile('/test/file.ts', 'utf-8');
    expect(result).toContain("import type { UserSettings } from '../shared/types/user-settings.js';");
    expect(result).toContain("import type { WebviewMessage, ExtensionMessage } from '../types/webview.js';");
  });

  test('rimuove estensioni duplicate dalle importazioni', async () => {
    const testFile = {
      '/test/file.ts': `
        import { ApiConfiguration } from './api.types.js.js';
        import { JarvisProvider } from '../core/webview/JarvisProvider.js.js';
        
        // Codice...
      `
    };
    
    vol.fromJSON(testFile);
    
    await fixImports('/test', { dryRun: false, verbose: false });
    
    const result = await fs.readFile('/test/file.ts', 'utf-8');
    expect(result).toContain("import { ApiConfiguration } from './api.types.js';");
    expect(result).toContain("import { JarvisProvider } from '../core/webview/JarvisProvider.js';");
  });

  test('ignora file nei pattern di esclusione', async () => {
    const testFiles = {
      '/test/file.ts': `import { Logger } from '../utils/logger';`,
      '/test/node_modules/some-package/index.ts': `import { foo } from './bar';`
    };
    
    vol.fromJSON(testFiles);
    
    await fixImports('/test', { 
      dryRun: false, 
      verbose: false,
      exclude: ['**/node_modules/**']
    });
    
    // Il file normale dovrebbe essere modificato
    const result = await fs.readFile('/test/file.ts', 'utf-8');
    expect(result).toContain("import { Logger } from '../utils/logger.js';");
    
    // Il file in node_modules non dovrebbe essere modificato
    const excludedResult = await fs.readFile('/test/node_modules/some-package/index.ts', 'utf-8');
    expect(excludedResult).toContain("import { foo } from './bar';");
  });

  test('modalità dry-run non modifica i file', async () => {
    const originalContent = `import { Logger } from '../utils/logger';`;
    const testFile = {
      '/test/file.ts': originalContent
    };
    
    vol.fromJSON(testFile);
    
    await fixImports('/test', { dryRun: true, verbose: false });
    
    // Il contenuto del file non dovrebbe cambiare in modalità dry-run
    const result = await fs.readFile('/test/file.ts', 'utf-8');
    expect(result).toBe(originalContent);
  });

  test('gestisce correttamente importazioni miste di valori e tipi', async () => {
    const testFile = {
      '/test/file.ts': `
        // Importazione mista (tipo e valore)
        import { Component, type ComponentProps } from 'react';
        import { useState, useEffect, type ReactNode } from 'react';
        
        // Codice che usa sia i valori che i tipi
        const MyComponent: React.FC<ComponentProps> = () => {
          const [state, setState] = useState<string>('');
          useEffect(() => {}, []);
          
          return <div>{state}</div>;
        };
      `
    };
    
    vol.fromJSON(testFile);
    
    await fixImports('/test', { dryRun: false, verbose: false });
    
    const result = await fs.readFile('/test/file.ts', 'utf-8');
    // Le importazioni miste dovrebbero rimanere intatte
    expect(result).toContain("import { Component, type ComponentProps } from 'react';");
    expect(result).toContain("import { useState, useEffect, type ReactNode } from 'react';");
  });
}); 