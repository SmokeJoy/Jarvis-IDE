/**
 * @file webview.types.test.ts
 * @description Test unitari per i type guards e le funzioni di conversione in webview.types.ts
 */

import { describe, it, expect } from 'vitest';
import type { 
  isExtensionMessage, 
  isWebviewMessage, 
  convertToWebviewMessage,
  WebviewMessageType,
  ExtensionMessage,
  WebviewMessage
} from './webview.types.js.js';

describe('Type guards per messaggi', () => {
  describe('isExtensionMessage', () => {
    it('dovrebbe identificare correttamente un ExtensionMessage valido', () => {
      const message: ExtensionMessage = {
        type: 'test',
        payload: { foo: 'bar' }
      };
      
      expect(isExtensionMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare un messaggio non valido', () => {
      expect(isExtensionMessage(null)).toBe(false);
      expect(isExtensionMessage(undefined)).toBe(false);
      expect(isExtensionMessage(42)).toBe(false);
      expect(isExtensionMessage('string')).toBe(false);
      expect(isExtensionMessage({})).toBe(false);
      expect(isExtensionMessage({ payload: {} })).toBe(false);
    });
  });

  describe('isWebviewMessage', () => {
    it('dovrebbe identificare correttamente un WebviewMessage con type stringa', () => {
      const message: WebviewMessage = {
        type: 'customAction',
        payload: { data: 'test' }
      };
      
      expect(isWebviewMessage(message)).toBe(true);
    });

    it('dovrebbe identificare correttamente un WebviewMessage con type enum', () => {
      const message: WebviewMessage = {
        type: WebviewMessageType.ACTION,
        payload: { data: 'test' }
      };
      
      expect(isWebviewMessage(message)).toBe(true);
    });

    it('dovrebbe rifiutare un messaggio non valido', () => {
      expect(isWebviewMessage(null)).toBe(false);
      expect(isWebviewMessage(undefined)).toBe(false);
      expect(isWebviewMessage(42)).toBe(false);
      expect(isWebviewMessage('string')).toBe(false);
      expect(isWebviewMessage({})).toBe(false);
      expect(isWebviewMessage({ payload: {} })).toBe(false);
    });
  });

  describe('convertToWebviewMessage', () => {
    it('dovrebbe convertire un ExtensionMessage valido', () => {
      const input: ExtensionMessage = {
        type: 'test',
        payload: { foo: 'bar' },
        action: 'chatButtonClicked'
      };
      
      const result = convertToWebviewMessage(input);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('test');
      expect(result?.payload).toEqual({ foo: 'bar' });
      expect(result?.action).toBe('chatButtonClicked');
    });

    it('dovrebbe gestire il caso di error nel messaggio', () => {
      const input: ExtensionMessage = {
        type: 'error',
        error: 'Something went wrong'
      };
      
      const result = convertToWebviewMessage(input);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('error');
      expect(result?.payload).toHaveProperty('error', 'Something went wrong');
    });

    it('dovrebbe gestire il caso di apiConfiguration nel messaggio', () => {
      const input: ExtensionMessage = {
        type: 'apiConfig',
        apiConfiguration: {
          provider: 'test-provider',
          apiKey: 'test-key'
        }
      };
      
      const result = convertToWebviewMessage(input);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('apiConfig');
      expect(result?.apiConfiguration).toHaveProperty('provider', 'test-provider');
      expect(result?.apiConfiguration).toHaveProperty('apiKey', 'test-key');
    });

    it('dovrebbe gestire il caso di apiConfiguration nello state', () => {
      const input: ExtensionMessage = {
        type: 'stateUpdate',
        state: {
          apiConfiguration: {
            provider: 'test-provider',
            apiKey: 'test-key'
          }
        }
      };
      
      const result = convertToWebviewMessage(input);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('stateUpdate');
      expect(result?.apiConfiguration).toHaveProperty('provider', 'test-provider');
      expect(result?.apiConfiguration).toHaveProperty('apiKey', 'test-key');
    });

    it('dovrebbe restituire null per input non validi', () => {
      expect(convertToWebviewMessage(null as any)).toBeNull();
      expect(convertToWebviewMessage(undefined as any)).toBeNull();
      expect(convertToWebviewMessage({} as any)).toBeNull();
      expect(convertToWebviewMessage({ payload: {} } as any)).toBeNull();
    });
  });
}); 