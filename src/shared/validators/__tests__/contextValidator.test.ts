/**
 * 🛠️ Test per i validatori di contesto
 * - Validazione input/output
 * - Tipizzazione esplicita
 * - Gestione errori
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextValidationResult, ContextData } from '../../types';
import { Logger } from '../../logging';
import {
  validateContextData,
  validateContextMetadata,
  isValidContextId,
  validateContextArray
} from '../contextValidator';

// Mock del logger
vi.mock('../../logging', () => ({
  Logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Context Validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateContextData', () => {
    it('dovrebbe validare dati di contesto validi', () => {
      const validContext: ContextData = {
        id: 'ctx_123',
        content: 'Test content',
        type: 'text',
        metadata: {
          timestamp: Date.now(),
          source: 'user'
        }
      };

      const result = validateContextData(validContext);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('dovrebbe rifiutare dati di contesto non validi', () => {
      const invalidContext = {
        content: 'Missing ID',
        type: 'text'
      };

      const result = validateContextData(invalidContext as ContextData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('ID mancante');
      expect(Logger.error).toHaveBeenCalled();
    });

    it('dovrebbe validare tipi di contesto supportati', () => {
      const validTypes = ['text', 'code', 'image', 'file'];
      
      validTypes.forEach(type => {
        const context: ContextData = {
          id: 'ctx_123',
          content: 'Test content',
          type,
          metadata: { timestamp: Date.now() }
        };
        
        const result = validateContextData(context);
        expect(result.isValid).toBe(true);
      });

      // Tipo non supportato
      const invalidContext: ContextData = {
        id: 'ctx_123',
        content: 'Test content',
        type: 'invalid_type' as any,
        metadata: { timestamp: Date.now() }
      };

      const result = validateContextData(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipo di contesto non supportato: invalid_type');
    });

    it('dovrebbe validare la lunghezza del contenuto', () => {
      // Contenuto troppo lungo
      const longContent = 'a'.repeat(1000001); // > 1MB
      const context: ContextData = {
        id: 'ctx_123',
        content: longContent,
        type: 'text',
        metadata: { timestamp: Date.now() }
      };

      const result = validateContextData(context);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contenuto troppo lungo');
      expect(Logger.warn).toHaveBeenCalled();
    });
  });

  describe('validateContextMetadata', () => {
    it('dovrebbe validare metadata validi', () => {
      const validMetadata = {
        timestamp: Date.now(),
        source: 'user',
        tags: ['test', 'validation']
      };

      const result = validateContextMetadata(validMetadata);
      expect(result.isValid).toBe(true);
    });

    it('dovrebbe rifiutare metadata non validi', () => {
      const invalidMetadata = {
        timestamp: 'not a number',
        tags: 'not an array'
      };

      const result = validateContextMetadata(invalidMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('isValidContextId', () => {
    it('dovrebbe validare ID di contesto validi', () => {
      expect(isValidContextId('ctx_123')).toBe(true);
      expect(isValidContextId('ctx_abc_123')).toBe(true);
    });

    it('dovrebbe rifiutare ID di contesto non validi', () => {
      expect(isValidContextId('')).toBe(false);
      expect(isValidContextId('invalid-id')).toBe(false);
      expect(isValidContextId('123')).toBe(false);
      expect(isValidContextId(null as any)).toBe(false);
      expect(isValidContextId(undefined as any)).toBe(false);
    });
  });

  describe('validateContextArray', () => {
    it('dovrebbe validare array di contesti validi', () => {
      const contexts: ContextData[] = [
        {
          id: 'ctx_1',
          content: 'Test 1',
          type: 'text',
          metadata: { timestamp: Date.now() }
        },
        {
          id: 'ctx_2',
          content: 'Test 2',
          type: 'code',
          metadata: { timestamp: Date.now() }
        }
      ];

      const result = validateContextArray(contexts);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('dovrebbe identificare contesti non validi in array', () => {
      const contexts = [
        {
          id: 'ctx_1',
          content: 'Valid',
          type: 'text',
          metadata: { timestamp: Date.now() }
        },
        {
          // ID mancante
          content: 'Invalid',
          type: 'text',
          metadata: { timestamp: Date.now() }
        }
      ];

      const result = validateContextArray(contexts as ContextData[]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('Contesto non valido all\'indice 1');
    });

    it('dovrebbe gestire input non array', () => {
      const result = validateContextArray('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input non è un array');
      expect(Logger.error).toHaveBeenCalled();
    });

    it('dovrebbe validare array vuoti', () => {
      const result = validateContextArray([]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });
}); 