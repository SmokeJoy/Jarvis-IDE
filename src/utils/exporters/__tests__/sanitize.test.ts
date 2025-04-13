import { describe, it, expect } from 'vitest';
import { sanitizeExportObject, extractSanitizeOptions } from '../sanitize';
import { ExportOptions } from '../types';

describe('sanitizeExportObject', () => {
  describe('Gestione valori base', () => {
    it('dovrebbe mantenere i valori primitivi inalterati', () => {
      expect(sanitizeExportObject(123)).toBe(123);
      expect(sanitizeExportObject('test')).toBe('test');
      expect(sanitizeExportObject(true)).toBe(true);
      expect(sanitizeExportObject(false)).toBe(false);
    });

    it('dovrebbe convertire le date in formato ISO', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      expect(sanitizeExportObject(date)).toBe('2023-01-01T12:00:00.000Z');
    });

    it('dovrebbe gestire correttamente null e undefined', () => {
      expect(sanitizeExportObject(null)).toBe(null);
      expect(sanitizeExportObject(undefined)).toBe(undefined);
    });

    it('dovrebbe rimuovere valori null se specificato', () => {
      const input = { a: 1, b: null, c: 'test' };
      const result = sanitizeExportObject(input, { removeNull: true });
      expect(result).toEqual({ a: 1, c: 'test' });
    });

    it('dovrebbe rimuovere valori undefined se specificato', () => {
      const input = { a: 1, b: undefined, c: 'test' };
      const result = sanitizeExportObject(input, { removeUndefined: true });
      expect(result).toEqual({ a: 1, c: 'test' });
    });
  });

  describe('Gestione strutture complesse', () => {
    it('dovrebbe sanitizzare oggetti nidificati', () => {
      const input = {
        name: 'Test',
        details: {
          id: 123,
          metadata: {
            created: null,
            updated: undefined,
          },
        },
      };

      const result = sanitizeExportObject(input, { removeNull: true, removeUndefined: true });

      expect(result).toEqual({
        name: 'Test',
        details: {
          id: 123,
          metadata: {},
        },
      });
    });

    it('dovrebbe sanitizzare array di oggetti', () => {
      const input = [
        { id: 1, value: 'abc' },
        { id: 2, value: null },
        { id: 3, value: undefined },
      ];

      const result = sanitizeExportObject(input, { removeNull: true, removeUndefined: true });

      expect(result).toEqual([{ id: 1, value: 'abc' }, { id: 2 }, { id: 3 }]);
    });

    it('dovrebbe filtrare elementi di array se null/undefined', () => {
      const input = [1, null, 3, undefined, 5];

      const nullRemoved = sanitizeExportObject(input, { removeNull: true });
      expect(nullRemoved).toEqual([1, 3, undefined, 5]);

      const undefinedRemoved = sanitizeExportObject(input, { removeUndefined: true });
      expect(undefinedRemoved).toEqual([1, null, 3, 5]);

      const bothRemoved = sanitizeExportObject(input, { removeNull: true, removeUndefined: true });
      expect(bothRemoved).toEqual([1, 3, 5]);
    });
  });

  describe('Gestione limiti dimensionali', () => {
    it('dovrebbe troncare oggetti troppo profondi', () => {
      const createNestedObject = (depth: number): any => {
        if (depth <= 0) return 'value';
        return { nested: createNestedObject(depth - 1) };
      };

      const deepObject = createNestedObject(30);
      const result = sanitizeExportObject(deepObject, { maxDepth: 5 });

      // Verifica che l'oggetto sia stato troncato
      let current = result;
      let depth = 0;
      while (current && typeof current === 'object' && current.nested) {
        current = current.nested;
        depth++;
      }

      expect(depth).toBe(5);
      expect(current).toBe('[Oggetto troppo profondo]');
    });

    it('dovrebbe troncare stringhe troppo lunghe', () => {
      const longString = 'a'.repeat(2000);
      const result = sanitizeExportObject(longString, { maxStringLength: 100 });

      expect(result.length).toBeLessThan(longString.length);
      expect(result).toContain('... [troncato, lunghezza originale: 2000]');
      expect(result).toContain('a'.repeat(100));
    });

    it('dovrebbe troncare array troppo lunghi', () => {
      const longArray = Array(2000).fill('item');
      const result = sanitizeExportObject(longArray, { maxArrayLength: 50 });

      expect(result.length).toBe(51); // 50 items + 1 message
      expect(result[50]).toContain('1950 elementi aggiuntivi omessi');
    });
  });

  describe('Gestione casi speciali', () => {
    it('dovrebbe gestire funzioni convertendole in undefined', () => {
      const input = { fn: () => 'test', id: 123 };
      const result = sanitizeExportObject(input);

      expect(result).toEqual({ id: 123 });
    });

    it('dovrebbe gestire simboli convertendoli in undefined', () => {
      const sym = Symbol('test');
      const input = { sym, id: 123 };
      const result = sanitizeExportObject(input);

      expect(result).toEqual({ id: 123 });
    });

    it('dovrebbe gestire oggetti circolari senza entrare in loop infinito', () => {
      const circular: Record<string, any> = { id: 123 };
      circular.self = circular;

      const result = sanitizeExportObject(circular);
      expect(result.id).toBe(123);
      expect(typeof result.self).toBe('object');
      expect(result.self.id).toBe(123);
    });
  });
});

describe('extractSanitizeOptions', () => {
  it('dovrebbe estrarre solo le opzioni relative alla sanitizzazione', () => {
    const fullOptions: Partial<ExportOptions> = {
      format: 'JSON',
      indent: 2,
      fileName: 'test.json',
      removeNull: true,
      removeUndefined: true,
      maxDepth: 5,
      maxStringLength: 100,
      maxArrayLength: 50,
      includeHeaders: true,
    };

    const result = extractSanitizeOptions(fullOptions);

    expect(result).toEqual({
      removeNull: true,
      removeUndefined: true,
      maxDepth: 5,
      maxStringLength: 100,
      maxArrayLength: 50,
    });

    // Verifica che altre proprietà non siano incluse
    expect(result).not.toHaveProperty('format');
    expect(result).not.toHaveProperty('indent');
    expect(result).not.toHaveProperty('fileName');
    expect(result).not.toHaveProperty('includeHeaders');
  });

  it('dovrebbe restituire un oggetto vuoto se non vengono fornite opzioni', () => {
    expect(extractSanitizeOptions()).toEqual({});
    expect(extractSanitizeOptions({})).toEqual({});
  });
});
