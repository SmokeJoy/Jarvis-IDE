import { vi } from 'vitest';
/**
 * @file validate.test.ts
 * @description Test per le funzioni di validazione dei messaggi
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isObject, 
  isNonEmptyString, 
  validateMessage,
  validateMessageGeneric,
  createMessageValidator,
  isBaseMessage,
  type MessageValidationResult
} from './validate';
import { BaseMessage } from '../../../src/shared/types/base-message';

// Mock per Logger
vi.mock('./Logger', () => {
  return {
    Logger: vi.fn().mockImplementation(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }))
  };
});

describe('validate utility', () => {
  describe('isObject', () => {
    it('should return true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject(42)).toBe(false);
      expect(isObject('hello')).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString(' trimmed ')).toBe(true);
    });

    it('should return false for empty strings or non-strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(42)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe('isBaseMessage', () => {
    it('should return true for valid base messages', () => {
      expect(isBaseMessage({ type: 'test' })).toBe(true);
      expect(isBaseMessage({ type: 'test', payload: { data: 'test' } })).toBe(true);
      expect(isBaseMessage({ type: 'test', error: 'Error message' })).toBe(true);
    });

    it('should return false for invalid messages', () => {
      expect(isBaseMessage(null)).toBe(false);
      expect(isBaseMessage({})).toBe(false);
      expect(isBaseMessage({ type: '' })).toBe(false);
      expect(isBaseMessage({ type: 42 })).toBe(false);
      expect(isBaseMessage({ type: 'test', payload: 42 })).toBe(false);
      expect(isBaseMessage({ type: 'test', error: 42 })).toBe(false);
    });
  });

  describe('validateMessage', () => {
    it('should validate correct messages', () => {
      const result = validateMessage({ type: 'test', payload: { data: 'value' } });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-objects', () => {
      const result = validateMessage(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('deve essere un oggetto');
    });

    it('should reject messages without valid type', () => {
      const result = validateMessage({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('type');
    });

    it('should accept messages with array payload', () => {
      const result = validateMessage({ type: 'test', payload: ['item1', 'item2'] });
      expect(result.valid).toBe(true);
    });

    it('should accept messages with string payload', () => {
      const result = validateMessage({ type: 'test', payload: 'string data' });
      expect(result.valid).toBe(true);
    });

    it('should reject messages with invalid payload type', () => {
      const result = validateMessage({ type: 'test', payload: 42 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('payload');
    });

    it('should reject messages with invalid error field', () => {
      const result = validateMessage({ type: 'test', error: 42 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('error');
    });
  });

  describe('validateMessageGeneric', () => {
    it('should validate messages of the correct type', () => {
      const result = validateMessageGeneric(
        { type: 'test:action', payload: { id: '123' } },
        'test:action'
      );
      expect(result.valid).toBe(true);
    });

    it('should reject messages of the wrong type', () => {
      const result = validateMessageGeneric(
        { type: 'wrong:type', payload: { id: '123' } },
        'test:action'
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Tipo messaggio errato');
    });

    it('should validate required payload fields', () => {
      interface TestPayload { id: string; name: string; }
      
      const result = validateMessageGeneric<TestPayload>(
        { type: 'test:action', payload: { id: '123', name: 'Test' } },
        'test:action',
        ['id', 'name']
      );
      expect(result.valid).toBe(true);
    });

    it('should reject messages missing required payload fields', () => {
      interface TestPayload { id: string; name: string; }
      
      const result = validateMessageGeneric<TestPayload>(
        { type: 'test:action', payload: { id: '123' } },
        'test:action',
        ['id', 'name']
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Campo obbligatorio');
    });
  });

  describe('createMessageValidator', () => {
    it('should create a validator function that validates messages', () => {
      interface TestPayload { id: string; value: number; }
      
      const validator = createMessageValidator<TestPayload>('test:action', ['id', 'value']);
      
      const validResult = validator({ 
        type: 'test:action', 
        payload: { id: '123', value: 42 } 
      });
      expect(validResult.valid).toBe(true);
      
      const invalidResult = validator({ 
        type: 'test:action', 
        payload: { id: '123' } 
      });
      expect(invalidResult.valid).toBe(false);
    });
  });
}); 