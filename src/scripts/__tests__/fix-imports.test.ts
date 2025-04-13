import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';

// Mock del modulo fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

// Importa il modulo dopo il mock
import {
  parseArguments,
  getFilesToProcess,
  processFile,
  DEFAULT_EXTENSIONS,
  DEFAULT_EXCLUDED_DIRS,
} from '../fix-imports';

describe('fix-imports.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('parseArguments', () => {
    test('dovrebbe impostare le opzioni predefinite quando non vengono forniti argomenti', () => {
      const result = parseArguments([]);
      expect(result).toEqual({
        check: false,
        verbose: false,
        help: false,
        paths: ['.'],
      });
    });

    test("dovrebbe riconoscere l'opzione --check", () => {
      const result = parseArguments(['--check']);
      expect(result.check).toBe(true);
    });

    test("dovrebbe riconoscere l'opzione --verbose", () => {
      const result = parseArguments(['--verbose']);
      expect(result.verbose).toBe(true);
    });

    test("dovrebbe riconoscere l'opzione --help", () => {
      const result = parseArguments(['--help']);
      expect(result.help).toBe(true);
    });

    test('dovrebbe raccogliere i percorsi dei file', () => {
      const result = parseArguments(['file1.ts', 'file2.ts']);
      expect(result.paths).toEqual(['file1.ts', 'file2.ts']);
    });

    test('dovrebbe combinare opzioni e percorsi dei file', () => {
      const result = parseArguments(['--check', 'file1.ts', '--verbose', 'file2.ts']);
      expect(result).toEqual({
        check: true,
        verbose: true,
        help: false,
        paths: ['file1.ts', 'file2.ts'],
      });
    });
  });

  describe('getFilesToProcess', () => {
    test('dovrebbe restituire i file specificati se esistono', async () => {
      // Mock di fs.access per simulare che i file esistono
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      // Mock di fs.stat per simulare che sono file
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false });

      const result = await getFilesToProcess(
        ['file1.ts', 'file2.ts'],
        DEFAULT_EXTENSIONS,
        DEFAULT_EXCLUDED_DIRS
      );
      expect(result).toEqual(['file1.ts', 'file2.ts']);
    });

    test('dovrebbe scansionare ricorsivamente le directory', async () => {
      // Configurazione dei mock per la directory principale
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.stat as jest.Mock).mockImplementation(async (filePath) => ({
        isDirectory: () => filePath === 'src',
      }));

      // Configurazione dei mock per la scansione della directory
      (fs.readdir as jest.Mock).mockResolvedValue(['file1.ts', 'file2.ts', 'subdir']);
      (fs.stat as jest.Mock).mockImplementation(async (filePath) => ({
        isDirectory: () => filePath === 'src/subdir',
      }));

      // Mock per la subdirectory
      (fs.readdir as jest.Mock).mockImplementation(async (dirPath) => {
        if (dirPath === 'src') {
          return ['file1.ts', 'file2.ts', 'subdir'];
        } else if (dirPath === 'src/subdir') {
          return ['file3.ts'];
        }
        return [];
      });

      const result = await getFilesToProcess(['src'], DEFAULT_EXTENSIONS, DEFAULT_EXCLUDED_DIRS);
      expect(result).toContain('src/file1.ts');
      expect(result).toContain('src/file2.ts');
      expect(result).toContain('src/subdir/file3.ts');
    });

    test('dovrebbe escludere i file non TypeScript', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.stat as jest.Mock).mockImplementation(async (filePath) => ({
        isDirectory: () => filePath === 'src',
      }));

      (fs.readdir as jest.Mock).mockResolvedValue(['file1.ts', 'file2.js', 'file3.json']);

      const result = await getFilesToProcess(['src'], ['.ts'], DEFAULT_EXCLUDED_DIRS);
      expect(result).toContain('src/file1.ts');
      expect(result).not.toContain('src/file2.js');
      expect(result).not.toContain('src/file3.json');
    });
  });

  describe('processFile', () => {
    test('dovrebbe aggiungere estensione .js a import relativi', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue("import { foo } from '../utils/foo.dummy';"); // eslint-disable-line

      await processFile('src/file.ts', false, false);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'src/file.ts',
        "import { foo } from '../utils/foo.dummy';", // eslint-disable-line
        'utf8'
      );
    });

    test('non dovrebbe modificare import che hanno già estensione', async () => {
      const content = "import { foo } from '../utils/foo';";
      (fs.readFile as jest.Mock).mockResolvedValue(content);

      await processFile('src/file.ts', false, false);

      expect(fs.writeFile).toHaveBeenCalledWith('src/file.ts', content, 'utf8');
    });

    test('non dovrebbe modificare import dai moduli Node', async () => {
      const content = "import fs from 'fs';";
      (fs.readFile as jest.Mock).mockResolvedValue(content);

      await processFile('src/file.ts', false, false);

      expect(fs.writeFile).toHaveBeenCalledWith('src/file.ts', content, 'utf8');
    });

    test('dovrebbe correggere correttamente vari pattern di import', async () => {
      const content = `
        import { foo } from '../utils/foo';
        import type { Bar } from './types';
        import default from '../components/default';
        import * as helpers from '../helpers';
      `;

      const expected = `
        import { foo } from '../utils/foo';
        import type { Bar } from './types';
        import default from '../components/default';
        import * as helpers from '../helpers';
      `;

      (fs.readFile as jest.Mock).mockResolvedValue(content);

      await processFile('src/file.ts', false, false);

      expect(fs.writeFile).toHaveBeenCalledWith('src/file.ts', expected, 'utf8');
    });

    test('non dovrebbe modificare file in modalità check', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue("import { foo } from '../utils/foo';");

      await processFile('src/file.ts', true, false);

      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    test('dovrebbe gestire correttamente i commenti', async () => {
      const content = `
        // import { foo } from '../utils/foo';
        import { bar } from '../utils/bar';
        /* 
        import { baz } from '../utils/baz';
        */
      `;

      const expected = `
        // import { foo } from '../utils/foo';
        import { bar } from '../utils/bar';
        /* 
        import { baz } from '../utils/baz';
        */
      `;

      (fs.readFile as jest.Mock).mockResolvedValue(content);

      await processFile('src/file.ts', false, false);

      expect(fs.writeFile).toHaveBeenCalledWith('src/file.ts', expected, 'utf8');
    });
  });
});
