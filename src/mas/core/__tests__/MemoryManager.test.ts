/**
 * @file MemoryManager.test.ts
 * @description Test per la classe MemoryManager
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryManager } from '../MemoryManager';

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
      await memoryManager.set('stringa', 'testo');
      await memoryManager.set('numero', 42);
      await memoryManager.set('booleano', true);
      await memoryManager.set('oggetto', { nome: 'test' });
      await memoryManager.set('array', [1, 2, 3]);

      expect(await memoryManager.get('stringa')).toBe('testo');
      expect(await memoryManager.get('numero')).toBe(42);
      expect(await memoryManager.get('booleano')).toBe(true);
      expect(await memoryManager.get('oggetto')).toEqual({ nome: 'test' });
      expect(await memoryManager.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('get', () => {
    it('dovrebbe restituire il valore memorizzato', async () => {
      await memoryManager.set('chiave', 'valore');
      const risultato = await memoryManager.get('chiave');
      expect(risultato).toBe('valore');
    });

    it('dovrebbe restituire undefined per chiavi non esistenti', async () => {
      const risultato = await memoryManager.get('chiave_inesistente');
      expect(risultato).toBeUndefined();
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
  });

  describe('remove', () => {
    it('dovrebbe rimuovere una chiave dalla memoria', async () => {
      await memoryManager.set('chiave', 'valore');
      await memoryManager.remove('chiave');
      const risultato = await memoryManager.get('chiave');
      expect(risultato).toBeUndefined();
    });

    it('non dovrebbe generare errori quando si rimuove una chiave inesistente', async () => {
      expect(async () => {
        await memoryManager.remove('chiave_inesistente');
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('dovrebbe rimuovere tutte le chiavi dalla memoria', async () => {
      await memoryManager.set('chiave1', 'valore1');
      await memoryManager.set('chiave2', 'valore2');
      await memoryManager.clear();
      
      expect(await memoryManager.get('chiave1')).toBeUndefined();
      expect(await memoryManager.get('chiave2')).toBeUndefined();
    });
  });
}); 