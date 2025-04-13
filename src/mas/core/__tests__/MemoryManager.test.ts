/**
 * @file MemoryManager.test.ts
 * @description Test per la classe MemoryManager
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryManager } from '../MemoryManager';

// Tipi per i test
type TestValue = string | number | boolean | object | any[];

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager();
  });

  describe('set', () => {
    it('dovrebbe impostare un valore in memoria', async () => {
      await memoryManager.set('chiave', 'valore');
      const risultato = await memoryManager.get('chiave');
      expect(risultato).toBe('valore');
    });

    it('dovrebbe sovrascrivere un valore esistente', async () => {
      await memoryManager.set('chiave', 'valore1');
      await memoryManager.set('chiave', 'valore2');
      const risultato = await memoryManager.get('chiave');
      expect(risultato).toBe('valore2');
    });

    it('dovrebbe impostare valori di diversi tipi', async () => {
      const testValues: Record<string, TestValue> = {
        stringa: 'testo',
        numero: 42,
        booleano: true,
        oggetto: { nome: 'test' },
        array: [1, 2, 3],
      };

      for (const [key, value] of Object.entries(testValues)) {
        await memoryManager.set(key, value);
        const risultato = await memoryManager.get(key);
        expect(risultato).toEqual(value);
      }
    });

    it('dovrebbe gestire valori null e undefined', async () => {
      await memoryManager.set('nullo', null);
      await memoryManager.set('undefined', undefined);

      expect(await memoryManager.get('nullo')).toBeNull();
      expect(await memoryManager.get('undefined')).toBeNull();
    });
  });

  describe('get', () => {
    it('dovrebbe restituire il valore memorizzato', async () => {
      await memoryManager.set('chiave', 'valore');
      const risultato = await memoryManager.get('chiave');
      expect(risultato).toBe('valore');
    });

    it('dovrebbe restituire null per chiavi non esistenti', async () => {
      const risultato = await memoryManager.get('chiave_inesistente');
      expect(risultato).toBeNull();
    });

    it('dovrebbe restituire null per chiavi vuote', async () => {
      const risultato = await memoryManager.get('');
      expect(risultato).toBeNull();
    });
  });

  describe('append', () => {
    it('dovrebbe aggiungere valori a un array esistente', async () => {
      await memoryManager.set('lista', [1, 2]);
      await memoryManager.append('lista', 3);
      const risultato = await memoryManager.get('lista');
      expect(risultato).toEqual([1, 2, 3]);
    });

    it('dovrebbe creare un nuovo array se la chiave non esiste', async () => {
      await memoryManager.append('nuova_lista', 1);
      const risultato = await memoryManager.get('nuova_lista');
      expect(risultato).toEqual([1]);
    });

    it('dovrebbe convertire un valore non-array in array prima di aggiungere', async () => {
      await memoryManager.set('valore', 'test');
      await memoryManager.append('valore', 'nuovo');
      const risultato = await memoryManager.get('valore');
      expect(risultato).toEqual(['test', 'nuovo']);
    });

    it('dovrebbe aggiungere oggetti complessi', async () => {
      await memoryManager.set('oggetti', [{ id: 1 }]);
      await memoryManager.append('oggetti', { id: 2 });
      const risultato = await memoryManager.get('oggetti');
      expect(risultato).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('dovrebbe gestire valori null e undefined', async () => {
      await memoryManager.set('nullo', null);
      await memoryManager.append('nullo', 'valore');
      const risultato = await memoryManager.get('nullo');
      expect(risultato).toEqual(['valore']);

      await memoryManager.set('undefined', undefined);
      await memoryManager.append('undefined', 'valore');
      const risultato2 = await memoryManager.get('undefined');
      expect(risultato2).toEqual(['valore']);
    });
  });

  describe('remove', () => {
    it('dovrebbe rimuovere una chiave dalla memoria', async () => {
      await memoryManager.set('chiave', 'valore');
      await memoryManager.remove('chiave');
      const risultato = await memoryManager.get('chiave');
      expect(risultato).toBeNull();
    });

    it('non dovrebbe generare errori quando si rimuove una chiave inesistente', async () => {
      await expect(memoryManager.remove('chiave_inesistente')).resolves.not.toThrow();
    });

    it('non dovrebbe generare errori quando si rimuove una chiave vuota', async () => {
      await expect(memoryManager.remove('')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('dovrebbe rimuovere tutte le chiavi dalla memoria', async () => {
      await memoryManager.set('chiave1', 'valore1');
      await memoryManager.set('chiave2', 'valore2');
      await memoryManager.clear();

      expect(await memoryManager.get('chiave1')).toBeNull();
      expect(await memoryManager.get('chiave2')).toBeNull();
    });

    it('dovrebbe gestire correttamente la memoria vuota', async () => {
      await memoryManager.clear();
      expect(await memoryManager.get('qualsiasi_chiave')).toBeNull();
    });
  });

  describe('concorrenza', () => {
    it('dovrebbe gestire operazioni concorrenti correttamente', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => i);

      await Promise.all(
        operations.map(async (i) => {
          await memoryManager.set(`chiave${i}`, `valore${i}`);
          await memoryManager.append('lista', i);
        })
      );

      expect(await memoryManager.get('lista')).toHaveLength(100);

      for (let i = 0; i < 100; i++) {
        expect(await memoryManager.get(`chiave${i}`)).toBe(`valore${i}`);
      }
    });
  });
});
