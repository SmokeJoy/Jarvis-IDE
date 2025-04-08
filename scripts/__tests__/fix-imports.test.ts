import fs from 'fs/promises';
import path from 'path';
import { Volume, createFsFromVolume } from 'memfs';

// Mocking fs/promises functions
jest.mock('fs/promises', () => {
  const originalModule = jest.requireActual('fs/promises');
  return {
    ...originalModule,
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn().mockImplementation(() => Promise.resolve())
  };
});

// Mocking path functions
jest.mock('path', () => {
  const originalModule = jest.requireActual('path');
  return {
    ...originalModule,
    join: jest.fn().mockImplementation((...args) => args.join('/')),
    extname: jest.fn().mockImplementation(originalModule.extname),
    basename: jest.fn().mockImplementation(originalModule.basename),
    dirname: jest.fn().mockImplementation(originalModule.dirname),
    isAbsolute: jest.fn().mockImplementation(() => false)
  };
});

// Setup mock file system
const mockFileSystem = {
  '/project/src/module.ts': `import { helper } from './utils/helper';
import { Component } from 'react';
import * as fs from 'fs';
import path from '../path';
import type { User } from './types';
import { config } from './config.js';`,

  '/project/src/brokenImport.ts': `import { helper } from './utils/helper.js.js';
import { Component } from 'react.js';
import { broken } from './broken.js.js.js';`,

  '/project/src/typeImport.ts': `import { type User } from './types';
import {type Config, type Settings } from './config';
import {User, type Admin, type Role} from './users';`,

  '/project/src/utils/helper.ts': `export const helper = () => 'helper';`,
  '/project/src/config.js': `export const config = { debug: true };`,
  '/project/src/types.ts': `export type User = { id: string, name: string };`,
  '/project/node_modules/module.ts': `should be skipped`,
  '/project/dist/bundle.js': `should be skipped`,
};

// Import the actual implementation after mocks are set up
const fixImportsPath = '../fix-imports';

// Import and type the actual functions we want to test
let fixImportsInFile: (filePath: string, dryRun?: boolean) => Promise<boolean>;
let processDirectory: (directoryPath: string, options: { dryRun?: boolean, exclude?: string[] }) => Promise<{ modified: number, total: number }>;

describe('fix-imports script', () => {
  // Setup before each test
  beforeEach(() => {
    // Setup the virtual file system
    const vol = Volume.fromJSON(mockFileSystem);
    const memfs = createFsFromVolume(vol);

    // Mock the fs functions
    (fs.readFile as jest.Mock).mockImplementation((path) => {
      if (mockFileSystem[path]) {
        return Promise.resolve(Buffer.from(mockFileSystem[path]));
      }
      return Promise.reject(new Error(`File not found: ${path}`));
    });

    (fs.writeFile as jest.Mock).mockImplementation((path, content) => {
      mockFileSystem[path] = content;
      return Promise.resolve();
    });

    (fs.readdir as jest.Mock).mockImplementation((dirPath) => {
      const dir = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
      const files = Object.keys(mockFileSystem)
        .filter(path => path.startsWith(dir))
        .map(path => {
          const relativePath = path.slice(dir.length);
          const firstSegment = relativePath.split('/')[0];
          return firstSegment;
        });
      return Promise.resolve([...new Set(files)]);
    });

    (fs.stat as jest.Mock).mockImplementation((filePath) => {
      const isDirectory = Object.keys(mockFileSystem)
        .some(path => path.startsWith(`${filePath}/`));
      
      return Promise.resolve({
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory && mockFileSystem[filePath] !== undefined
      });
    });

    // Import the actual implementation dynamically
    // We need to use a dynamic import with jest.isolateModules to ensure 
    // the module is freshly loaded after we've set up our mocks
    return jest.isolateModules(async () => {
      const module = await import(fixImportsPath);
      fixImportsInFile = module.fixImportsInFile;
      processDirectory = module.processDirectory;
    });
  });

  test('fixImportsInFile should add .js to relative imports', async () => {
    await fixImportsInFile('/project/src/module.ts');
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/module.ts',
      expect.stringContaining(`import { helper } from './utils/helper.js';`)
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/module.ts',
      expect.stringContaining(`import path from '../path.js';`)
    );
    // Should not modify node imports or absolute imports
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/module.ts',
      expect.stringContaining(`import { Component } from 'react';`)
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/module.ts',
      expect.stringContaining(`import * as fs from 'fs';`)
    );
  });

  test('fixImportsInFile should not modify files in dry run mode', async () => {
    await fixImportsInFile('/project/src/module.ts', true);
    
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  test('fixImportsInFile should correct type imports', async () => {
    await fixImportsInFile('/project/src/typeImport.ts');
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/typeImport.ts',
      expect.stringContaining(`import type { User } from './types.js';`)
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/typeImport.ts',
      expect.stringContaining(`import type { Config, Settings } from './config.js';`)
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/typeImport.ts',
      expect.stringContaining(`import {User, type Admin, type Role} from './users.js';`)
    );
  });

  test('fixImportsInFile should remove duplicate .js.js extensions', async () => {
    await fixImportsInFile('/project/src/brokenImport.ts');
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/brokenImport.ts',
      expect.stringContaining(`import { helper } from './utils/helper.js';`)
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/brokenImport.ts',
      expect.stringContaining(`import { broken } from './broken.js';`)
    );
    // Should not modify node modules with .js in their name
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/project/src/brokenImport.ts',
      expect.stringContaining(`import { Component } from 'react.js';`)
    );
  });

  test('processDirectory should process files recursively', async () => {
    (fs.readdir as jest.Mock).mockImplementation((dirPath) => {
      if (dirPath === '/project/src') {
        return Promise.resolve(['module.ts', 'brokenImport.ts', 'typeImport.ts', 'utils', 'config.js', 'types.ts']);
      }
      if (dirPath === '/project/src/utils') {
        return Promise.resolve(['helper.ts']);
      }
      return Promise.resolve([]);
    });

    (fs.stat as jest.Mock).mockImplementation((path) => {
      return Promise.resolve({
        isDirectory: () => path === '/project/src/utils',
        isFile: () => path !== '/project/src/utils'
      });
    });

    const result = await processDirectory('/project/src', { dryRun: false });
    
    expect(result.total).toBeGreaterThan(0);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  test('processDirectory should skip excluded directories', async () => {
    const result = await processDirectory('/project', { 
      dryRun: false, 
      exclude: ['node_modules', 'dist'] 
    });
    
    // Should not process files in node_modules or dist
    expect(fs.readFile).not.toHaveBeenCalledWith('/project/node_modules/module.ts', expect.anything());
    expect(fs.readFile).not.toHaveBeenCalledWith('/project/dist/bundle.js', expect.anything());
  });
}); 