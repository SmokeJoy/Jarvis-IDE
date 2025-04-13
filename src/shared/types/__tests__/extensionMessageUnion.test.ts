import { describe, test, expect } from 'vitest';
import {
  isExtensionMessage,
  ExtensionMessage,
  ExtensionMessageType,
} from '../extensionMessageUnion';
import { mockModelInfo } from '@/core/webview/__tests__/testUtils';

describe('extensionMessageUnion', () => {
  describe('isExtensionMessage', () => {
    // Helper per creare un messaggio valido
    const createValidMessage = <T extends ExtensionMessageType>(
      type: T,
      payload: any
    ): ExtensionMessage =>
      ({
        type,
        timestamp: Date.now(),
        payload,
      }) as ExtensionMessage;

    test('restituisce true per un messaggio log.update valido', () => {
      const message = createValidMessage('log.update', {
        level: 'info',
        message: 'Test log message',
        context: { test: true },
      });
      expect(isExtensionMessage(message, 'log.update')).toBe(true);
    });

    test('restituisce true per un messaggio error valido', () => {
      const message = createValidMessage('error', {
        code: 'TEST_ERROR',
        message: 'Test error message',
        details: { stack: 'Error stack' },
      });
      expect(isExtensionMessage(message, 'error')).toBe(true);
    });

    test('restituisce true per un messaggio info valido', () => {
      const message = createValidMessage('info', {
        message: 'Test info message',
        severity: 'warning',
      });
      expect(isExtensionMessage(message, 'info')).toBe(true);
    });

    test('restituisce true per un messaggio model.update valido', () => {
      const message = createValidMessage('model.update', {
        modelId: 'test-model',
        modelInfo: mockModelInfo,
        status: 'ready',
      });
      expect(isExtensionMessage(message, 'model.update')).toBe(true);
    });

    test('restituisce false per un tipo di messaggio non corrispondente', () => {
      const message = createValidMessage('error', {
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
      // Verifichiamo che un messaggio di error non passi come log.update
      expect(isExtensionMessage(message, 'log.update')).toBe(false);
    });

    test('restituisce false per null o undefined', () => {
      expect(isExtensionMessage(null, 'error')).toBe(false);
      expect(isExtensionMessage(undefined, 'error')).toBe(false);
    });

    test('restituisce false per oggetti non message', () => {
      expect(isExtensionMessage({}, 'error')).toBe(false);
      expect(isExtensionMessage([], 'error')).toBe(false);
      expect(isExtensionMessage(123, 'error')).toBe(false);
      expect(isExtensionMessage('string', 'error')).toBe(false);
    });

    test('restituisce false per oggetti senza type', () => {
      const invalidMessage = {
        timestamp: Date.now(),
        payload: { message: 'Test' },
      };
      expect(isExtensionMessage(invalidMessage, 'error')).toBe(false);
    });

    test('restituisce false per oggetti con type non stringa', () => {
      const invalidMessage = {
        type: 123, // type non stringa
        timestamp: Date.now(),
        payload: { message: 'Test' },
      };
      expect(isExtensionMessage(invalidMessage, 'error')).toBe(false);
    });

    test('restituisce false per oggetti senza payload', () => {
      const invalidMessage = {
        type: 'error',
        timestamp: Date.now(),
        // payload mancante
      };
      expect(isExtensionMessage(invalidMessage, 'error')).toBe(false);
    });

    test('restituisce false per oggetti senza timestamp', () => {
      const invalidMessage = {
        type: 'error',
        payload: { message: 'Test' },
        // timestamp mancante
      };
      expect(isExtensionMessage(invalidMessage, 'error')).toBe(false);
    });

    test('restituisce false per oggetti con timestamp non numerico', () => {
      const invalidMessage = {
        type: 'error',
        timestamp: 'not-a-number',
        payload: { message: 'Test' },
      };
      expect(isExtensionMessage(invalidMessage, 'error')).toBe(false);
    });
  });
});
