import { describe, it, expect } from 'vitest';
import { sanitizeExportObject, simplifyForLogging } from '../sanitize.js';

describe('sanitizeExportObject', () => {
  it('rimuove proprietà undefined e null', () => {
    const input = {
      a: 1,
      b: null,
      c: undefined,
      d: {
        x: null,
        y: 2,
        z: undefined,
        w: [1, null, 3, undefined]
      }
    };
    
    const result = sanitizeExportObject(input);
    
    expect(result).toEqual({
      a: 1,
      d: {
        y: 2,
        w: [1, 3]
      }
    });
  });

  it('preserva null se richiesto', () => {
    const input = {
      a: 1,
      b: null,
      c: {
        d: null,
        e: 2
      }
    };
    
    const result = sanitizeExportObject(input, { removeNull: false });
    
    expect(result).toEqual({
      a: 1,
      b: null,
      c: {
        d: null,
        e: 2
      }
    });
  });

  it('preserva undefined se richiesto', () => {
    const input = {
      a: 1,
      b: undefined,
      c: {
        d: undefined,
        e: 2
      }
    };
    
    const result = sanitizeExportObject(input, { removeUndefined: false });
    
    expect(result).toEqual({
      a: 1,
      b: undefined,
      c: {
        d: undefined,
        e: 2
      }
    });
  });

  it('gestisce array multi-livello', () => {
    const input = {
      arr: [
        1,
        [2, null, 3, [4, undefined, 5]],
        { a: null, b: 6 }
      ]
    };
    
    const result = sanitizeExportObject(input);
    
    expect(result).toEqual({
      arr: [
        1,
        [2, 3, [4, 5]],
        { b: 6 }
      ]
    });
  });

  it('rispetta il limite di profondità', () => {
    const deepObj = { level: 1 };
    let current = deepObj;
    
    // Creiamo un oggetto con 30 livelli di profondità
    for (let i = 2; i <= 30; i++) {
      current.next = { level: i };
      current = current.next;
    }
    
    // Sanitizziamo con un maxDepth di 5
    const result = sanitizeExportObject(deepObj, { maxDepth: 5 });
    
    // Verifichiamo che la struttura sia preservata fino al livello 5
    // ma che i livelli più profondi siano rimasti intatti
    let resultCurrent = result;
    for (let i = 1; i <= 5; i++) {
      expect(resultCurrent.level).toBe(i);
      resultCurrent = resultCurrent.next;
    }
    
    // Il livello 6 dovrebbe essere preservato intatto
    expect(resultCurrent).toBeDefined();
    expect(resultCurrent.level).toBe(6);
  });
});

describe('simplifyForLogging', () => {
  it('tronca stringhe lunghe', () => {
    const longString = 'a'.repeat(200);
    const result = simplifyForLogging({ str: longString });
    
    expect(result.str.length).toBeLessThan(longString.length);
    expect(result.str.endsWith('...')).toBe(true);
  });

  it('semplifica oggetti annidati oltre la profondità massima', () => {
    const deepObj = { a: { b: { c: { d: { e: 'value' } } } } };
    const result = simplifyForLogging(deepObj);
    
    // A seconda della MAX_DEPTH, ci aspettiamo [Object] da qualche parte
    const resultStr = JSON.stringify(result);
    expect(resultStr.includes('[Object]')).toBe(true);
  });

  it('semplifica array lunghi', () => {
    const longArray = Array(20).fill(1);
    const result = simplifyForLogging({ arr: longArray });
    
    expect(result.arr).toMatch(/\[Array\(\d+\)\]/);
  });
}); 