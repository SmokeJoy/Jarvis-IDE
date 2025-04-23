import { vi } from 'vitest';
/**
 * @file routerManager.test.ts
 * @description Test per il router manager
 * @author dev ai 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { routerManager } from '../routerManager';
import { webviewBridge } from '../../../utils/WebviewBridge';
import type { WebviewMessage, ExtensionMessage } from '@shared/messages';

// Mock del webviewBridge
vi.mock('../../../utils/WebviewBridge', () => ({
  webviewBridge: {
    sendMessage: vi.fn()
  }
}));

// Mock del logger
vi.mock('@shared/utils/outputLogger', () => ({
  default: {
    createComponentLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

describe('RouterManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    routerManager.dispose();
  });

  describe('message handling', () => {
    it('should handle valid message with registered handler', async () => {
      const handler = vi.fn();
      const message: WebviewMessage = {
        type: 'fetchSettings',
      };

      routerManager.registerHandler('fetchSettings', handler);

      // Simula un messaggio dalla window
      window.dispatchEvent(new MessageEvent('message', {
        data: message
      }));

      // Attende che il ciclo degli eventi completi
      await vi.runAllTimersAsync();

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should ignore invalid messages', async () => {
      const handler = vi.fn();
      routerManager.registerHandler('fetchSettings', handler);

      // Messaggio non valido (manca type)
      window.dispatchEvent(new MessageEvent('message', {
        data: { payload: 'test' }
      }));

      await vi.runAllTimersAsync();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should ignore messages without handler', async () => {
      const message: WebviewMessage = {
        type: 'fetchSettings',
      };

      // Nessun handler registrato
      window.dispatchEvent(new MessageEvent('message', {
        data: message
      }));

      await vi.runAllTimersAsync();
      // Non dovrebbe causare errori
      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle handler errors', async () => {
      const errorMessage = 'Test error';
      const handler = vi.fn().mockRejectedValue(new Error(errorMessage));
      const message: WebviewMessage = {
        type: 'fetchSettings',
      };

      routerManager.registerHandler('fetchSettings', handler);

      window.dispatchEvent(new MessageEvent('message', {
        data: message
      }));

      await vi.runAllTimersAsync();

      // Verifica che l'errore sia stato inviato all'estensione
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith({
        type: 'error',
        payload: {
          message: errorMessage
        }
      });
    });
  });

  describe('handler management', () => {
    it('should register and remove handlers', () => {
      const handler = vi.fn();
      const type = 'fetchSettings';

      routerManager.registerHandler(type, handler);
      routerManager.removeHandler(type);

      // Simula un messaggio
      window.dispatchEvent(new MessageEvent('message', {
        data: { type }
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not register handlers after dispose', () => {
      routerManager.dispose();
      const handler = vi.fn();

      routerManager.registerHandler('fetchSettings', handler);

      // Il messaggio non dovrebbe essere gestito
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'fetchSettings' }
      }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('message sending', () => {
    it('should send messages to extension', () => {
      const message: ExtensionMessage = {
        type: 'error',
        payload: {
          message: 'test error'
        }
      };

      routerManager.sendMessage(message);
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(message);
    });

    it('should not send messages after dispose', () => {
      routerManager.dispose();
      
      const message: ExtensionMessage = {
        type: 'error',
        payload: {
          message: 'test error'
        }
      };

      routerManager.sendMessage(message);
      expect(webviewBridge.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle send errors', () => {
      const error = new Error('Send error');
      vi.mocked(webviewBridge.sendMessage).mockImplementation(() => {
        throw error;
      });

      const message: ExtensionMessage = {
        type: 'error',
        payload: {
          message: 'test'
        }
      };

      // Non dovrebbe lanciare l'errore
      expect(() => routerManager.sendMessage(message)).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on dispose', () => {
      const handler = vi.fn();
      routerManager.registerHandler('fetchSettings', handler);

      routerManager.dispose();

      // Simula un messaggio dopo dispose
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'fetchSettings' }
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should be safe to dispose multiple times', () => {
      // Non dovrebbe causare errori
      routerManager.dispose();
      routerManager.dispose();
    });
  });
}); 