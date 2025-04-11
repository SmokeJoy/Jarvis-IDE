import { describe, it, expect } from 'vitest';
import type { 
  isWebviewMessage, 
  isExtensionMessage, 
  safeCastAs,
  strictGuard 
} from '../typeGuards.js';

describe('Type Guards', () => {
  describe('isWebviewMessage', () => {
    it('dovrebbe identificare messaggi WebView validi', () => {
      expect(isWebviewMessage({ type: 'getSettings' })).toBe(true);
      expect(isWebviewMessage({ type: 'chatRequest', payload: { prompt: 'Hello' } })).toBe(true);
      expect(isWebviewMessage({ type: 'cancelRequest' })).toBe(true);
    });

    it('dovrebbe rifiutare messaggi WebView non validi', () => {
      expect(isWebviewMessage(null)).toBe(false);
      expect(isWebviewMessage({})).toBe(false);
      expect(isWebviewMessage({ payload: 'test' })).toBe(false);
      expect(isWebviewMessage({ type: 123 })).toBe(false);
      expect(isWebviewMessage({ type: 'invalidType' })).toBe(false);
    });
  });

  describe('isExtensionMessage', () => {
    it('dovrebbe identificare messaggi Extension validi', () => {
      expect(isExtensionMessage({ type: 'response' })).toBe(true);
      expect(isExtensionMessage({ type: 'settings', payload: { theme: 'dark' } })).toBe(true);
      expect(isExtensionMessage({ type: 'error', payload: { message: 'Error' } })).toBe(true);
    });

    it('dovrebbe rifiutare messaggi Extension non validi', () => {
      expect(isExtensionMessage(null)).toBe(false);
      expect(isExtensionMessage({})).toBe(false);
      expect(isExtensionMessage({ payload: 'test' })).toBe(false);
      expect(isExtensionMessage({ type: 123 })).toBe(false);
      expect(isExtensionMessage({ type: 'invalidType' })).toBe(false);
    });
  });

  describe('safeCastAs', () => {
    it('dovrebbe restituire l\'oggetto se valido', () => {
      const validMsg = { type: 'chatRequest', payload: { prompt: 'Hello' } };
      expect(safeCastAs(validMsg)).toEqual(validMsg);
    });

    it('dovrebbe lanciare errore se l\'oggetto non è valido', () => {
      expect(() => safeCastAs(null)).toThrow();
      expect(() => safeCastAs(undefined)).toThrow();
      expect(() => safeCastAs('string')).toThrow();
    });
  });

  describe('strictGuard', () => {
    // Creiamo un guard di test
    const isNumber = (val: any): val is number => typeof val === 'number';
    const requireNumber = strictGuard<number>(isNumber, 'Number');

    it('dovrebbe restituire il valore se il guard restituisce true', () => {
      expect(requireNumber(42)).toBe(42);
      expect(requireNumber(0)).toBe(0);
    });

    it('dovrebbe lanciare errore se il guard restituisce false', () => {
      expect(() => requireNumber('42')).toThrow('Invalid Number format');
      expect(() => requireNumber(null)).toThrow('Invalid Number format');
      expect(() => requireNumber({})).toThrow('Invalid Number format');
    });
  });
}); 