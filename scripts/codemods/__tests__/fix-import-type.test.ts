import { vi } from 'vitest';
/**
 * @file fix-import-type.test.ts
 * @description Test per lo script di correzione degli import type
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { analyzeFile, applyFixes, scanDirectory, type ImportFix, type FixResult } from '../fix-import-type';

// Mock del logger
vi.mock('../../../src/shared/logging', () => ({
  getLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}));

const TEST_DIR = path.join(__dirname, 'fixtures');

describe('fix-import-type', () => {
  beforeEach(() => {
    // Crea directory di test
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Pulisci directory di test
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('analyzeFile', () => {
    it('dovrebbe trovare import type usati come valori', () => {
      const testFile = path.join(TEST_DIR, 'test.ts');
      const content = `
        import type { handler1, handler2 } from './handlers';
        import type { validator } from './validators';
        import { normalImport } from './normal';

        async function test() {
          await handler1(args);
          const result = validator();
        }
      `;

      fs.writeFileSync(testFile, content);

      const result = analyzeFile(testFile);

      expect(result.success).toBe(true);
      expect(result.fixes).toHaveLength(2);
      expect(result.fixes[0].original).toContain('import type { handler1');
      expect(result.fixes[1].original).toContain('import type { validator');
      expect(result.fixes[0].imports).toContain('handler1');
      expect(result.fixes[1].imports).toContain('validator');
    });

    it('non dovrebbe modificare import type usati solo come tipi', () => {
      const testFile = path.join(TEST_DIR, 'test.ts');
      const content = `
        import type { Handler } from './types';
        import type { Config } from './config';

        const myHandler: Handler = {
          execute: () => {}
        };
      `;

      fs.writeFileSync(testFile, content);

      const result = analyzeFile(testFile);

      expect(result.success).toBe(true);
      expect(result.fixes).toHaveLength(0);
    });

    it('dovrebbe gestire import multipli sulla stessa riga', () => {
      const testFile = path.join(TEST_DIR, 'test.ts');
      const content = `
        import type { handler1, validator1, helper } from './module1';
        import type { handler2 } from './module2';

        async function test() {
          await handler1();
          await handler2();
          validator1();
        }
      `;

      fs.writeFileSync(testFile, content);

      const result = analyzeFile(testFile);

      expect(result.success).toBe(true);
      expect(result.fixes).toHaveLength(2);
      expect(result.fixes.map(f => f.fixed)).toEqual([
        "import { handler1, validator1 } from './module1'",
        "import { handler2 } from './module2'"
      ]);
    });

    it('dovrebbe gestire import con alias', () => {
      const testFile = path.join(TEST_DIR, 'test.ts');
      const content = `
        import type { handler as myHandler, validator as myValidator } from './module';

        async function test() {
          await myHandler();
          myValidator();
        }
      `;

      fs.writeFileSync(testFile, content);

      const result = analyzeFile(testFile);

      expect(result.success).toBe(true);
      expect(result.fixes).toHaveLength(1);
      expect(result.fixes[0].imports).toEqual(['handler', 'validator']);
    });

    it('dovrebbe gestire errori di lettura file', () => {
      const testFile = path.join(TEST_DIR, 'nonexistent.ts');
      const result = analyzeFile(testFile);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.fixes).toHaveLength(0);
    });
  });

  describe('applyFixes', () => {
    it('dovrebbe applicare le correzioni al file', () => {
      const testFile = path.join(TEST_DIR, 'test.ts');
      const originalContent = `
        import type { handler1, validator } from './handlers';
        import { normalImport } from './normal';

        async function test() {
          await handler1();
          validator();
        }
      `;

      fs.writeFileSync(testFile, originalContent);

      const analyzeResult = analyzeFile(testFile);
      expect(analyzeResult.success).toBe(true);

      const result = applyFixes(testFile, analyzeResult.fixes);
      expect(result.success).toBe(true);

      const fixedContent = fs.readFileSync(testFile, 'utf-8');
      expect(fixedContent).toContain("import { handler1, validator } from './handlers'");
      expect(fixedContent).toContain("import { normalImport } from './normal'");
    });

    it('dovrebbe preservare altri import type', () => {
      const testFile = path.join(TEST_DIR, 'test.ts');
      const originalContent = `
        import type { Handler, Config } from './types';
        import type { validator } from './validators';
        
        const config: Config = {};
        validator();
      `;

      fs.writeFileSync(testFile, originalContent);

      const analyzeResult = analyzeFile(testFile);
      expect(analyzeResult.success).toBe(true);

      const result = applyFixes(testFile, analyzeResult.fixes);
      expect(result.success).toBe(true);

      const fixedContent = fs.readFileSync(testFile, 'utf-8');
      expect(fixedContent).toContain("import type { Handler, Config } from './types'");
      expect(fixedContent).toContain("import { validator } from './validators'");
    });

    it('non dovrebbe modificare file in modalità dry-run', () => {
      const testFile = path.join(TEST_DIR, 'test.ts');
      const originalContent = `
        import type { handler } from './handlers';
        handler();
      `;

      fs.writeFileSync(testFile, originalContent);

      const analyzeResult = analyzeFile(testFile);
      expect(analyzeResult.success).toBe(true);

      const result = applyFixes(testFile, analyzeResult.fixes, { dryRun: true });
      expect(result.success).toBe(true);

      const content = fs.readFileSync(testFile, 'utf-8');
      expect(content).toBe(originalContent);
    });

    it('dovrebbe gestire errori di scrittura file', () => {
      const testFile = path.join(TEST_DIR, 'readonly.ts');
      fs.writeFileSync(testFile, 'content');
      fs.chmodSync(testFile, 0o444); // Read-only

      const fixes: ImportFix[] = [{
        original: 'import type { x } from "y"',
        fixed: 'import { x } from "y"',
        line: 1,
        file: testFile,
        imports: ['x']
      }];

      const result = applyFixes(testFile, fixes);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('scanDirectory', () => {
    beforeEach(() => {
      // Crea struttura di test
      fs.mkdirSync(path.join(TEST_DIR, 'src'), { recursive: true });
      fs.mkdirSync(path.join(TEST_DIR, 'node_modules'), { recursive: true });
      fs.mkdirSync(path.join(TEST_DIR, 'src/components'), { recursive: true });
    });

    it('dovrebbe scansionare ricorsivamente una directory', () => {
      const file1 = path.join(TEST_DIR, 'src/test1.ts');
      const file2 = path.join(TEST_DIR, 'src/components/test2.ts');

      fs.writeFileSync(file1, 'import type { x } from "y"; x();');
      fs.writeFileSync(file2, 'import type { z } from "w"; z();');

      const result = scanDirectory(TEST_DIR);

      expect(result.success).toBe(true);
      expect(result.fixes).toHaveLength(2);
    });

    it('dovrebbe saltare le directory escluse', () => {
      const file1 = path.join(TEST_DIR, 'src/test.ts');
      const file2 = path.join(TEST_DIR, 'node_modules/test.ts');

      fs.writeFileSync(file1, 'import type { x } from "y"; x();');
      fs.writeFileSync(file2, 'import type { z } from "w"; z();');

      const result = scanDirectory(TEST_DIR);

      expect(result.success).toBe(true);
      expect(result.fixes).toHaveLength(1);
    });

    it('dovrebbe gestire errori di accesso directory', () => {
      const restrictedDir = path.join(TEST_DIR, 'restricted');
      fs.mkdirSync(restrictedDir);
      fs.chmodSync(restrictedDir, 0o000); // No permissions

      const result = scanDirectory(TEST_DIR);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
}); 