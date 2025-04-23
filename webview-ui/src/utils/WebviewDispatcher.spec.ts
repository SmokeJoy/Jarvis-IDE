import { vi } from 'vitest';
/**
 * @file WebviewDispatcher.spec.ts
 * @description Test per il WebviewDispatcher con Vitest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebviewDispatcher, webviewDispatcher, type BaseMessage } from './WebviewDispatcher';
import { Logger } from './Logger';

// Mocking della classe Logger
vi.mock('./Logger', () => {
  return {
    Logger: vi.fn().mockImplementation(() => {
    return {
        debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
        error: vi.fn()
      };
    })
    };
});

// Messaggi di test
const validMessage: BaseMessage = {
  type: 'test-message',
  payload: { value: 'test-data' }
};

const invalidMessage = {
  payload: { value: 'missing type field' }
};

describe('WebviewDispatcher', () => {
  // Setup dei mock per il window.acquireVsCodeApi e window.addEventListener
  const mockPostMessage = vi.fn();
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  let messageCallback: (event: MessageEvent) => void;

    beforeEach(() => {
    // Reset dei mock
        vi.clearAllMocks();

    // Mock di acquireVsCodeApi
    (window as any).acquireVsCodeApi = vi.fn().mockReturnValue({
      postMessage: mockPostMessage
    });
    
    // Mock di addEventListener per catturare il callback di messaggi
    window.addEventListener = vi.fn((event, callback) => {
      if (event === 'message') {
        messageCallback = callback as (event: MessageEvent) => void;
      }
      return originalAddEventListener.call(window, event, callback);
    });
    
    // Mock di removeEventListener
    window.removeEventListener = vi.fn();
  });
  
  afterEach(() => {
    // Ripristina i metodi originali
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    
    // Pulisci l'oggetto singleton per i test
    if ((WebviewDispatcher as any).instance) {
      (WebviewDispatcher as any).instance.dispose();
      (WebviewDispatcher as any).instance = undefined;
    }
  });

  describe('Singleton Pattern', () => {
    it('dovrebbe creare una sola istanza', () => {
      const instance1 = WebviewDispatcher.getInstance();
      const instance2 = WebviewDispatcher.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('dovrebbe esportare un\'istanza singleton come webviewDispatcher', () => {
      const instance = WebviewDispatcher.getInstance();
      expect(webviewDispatcher).toBe(instance);
    });
  });

  describe('Inizializzazione', () => {
    it('dovrebbe registrare un listener per i messaggi durante l\'inizializzazione', () => {
      WebviewDispatcher.getInstance();
      expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('dispose()', () => {
    it('dovrebbe rimuovere il listener dei messaggi quando viene chiamato dispose', () => {
      const instance = WebviewDispatcher.getInstance();
      instance.dispose();
      expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('sendMessage()', () => {
    it('dovrebbe inviare un messaggio valido utilizzando l\'API VS Code', () => {
      const instance = WebviewDispatcher.getInstance();
      const result = instance.sendMessage(validMessage);
      expect(result).toBe(true);
      expect(mockPostMessage).toHaveBeenCalledWith(validMessage);
    });

    it('dovrebbe rifiutare di inviare un messaggio non valido', () => {
      const instance = WebviewDispatcher.getInstance();
      const result = instance.sendMessage(invalidMessage as BaseMessage);
      expect(result).toBe(false);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('dovrebbe gestire gli errori durante l\'invio di un messaggio', () => {
      const instance = WebviewDispatcher.getInstance();
      mockPostMessage.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      const result = instance.sendMessage(validMessage);
      expect(result).toBe(false);
    });
  });

  describe('handleMessage()', () => {
    it('dovrebbe chiamare l\'handler registrato quando riceve un messaggio valido', () => {
      const instance = WebviewDispatcher.getInstance();
      const mockHandler = vi.fn();
      
      // Registra l'handler
      instance.on('test-message', mockHandler);
      
      // Simula un messaggio in arrivo
      messageCallback({
        data: validMessage
      } as MessageEvent);
      
      expect(mockHandler).toHaveBeenCalledWith(validMessage.payload);
    });

    it('non dovrebbe chiamare l\'handler quando riceve un messaggio non valido', () => {
      const instance = WebviewDispatcher.getInstance();
      const mockHandler = vi.fn();
      
      // Registra l'handler
      instance.on('test-message', mockHandler);
      
      // Simula un messaggio in arrivo non valido
      messageCallback({
        data: invalidMessage
      } as MessageEvent);
      
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('dovrebbe registrare un warning quando riceve un messaggio valido ma senza handler', () => {
      const instance = WebviewDispatcher.getInstance();
      const loggerInstance = new Logger('');
      
      // Simula un messaggio in arrivo
      messageCallback({
        data: validMessage
      } as MessageEvent);
      
      // Verifica che venga registrato un warning
      expect(loggerInstance.warn).toHaveBeenCalled();
    });
  });

  describe('on()', () => {
    it('dovrebbe registrare un handler e restituire una funzione per rimuoverlo', () => {
      const instance = WebviewDispatcher.getInstance();
      const mockHandler = vi.fn();
      
      // Registra l'handler
      const unsubscribe = instance.on('test-message', mockHandler);
      
      // Simula un messaggio in arrivo
      messageCallback({
        data: validMessage
      } as MessageEvent);
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
      
      // Rimuovi l'handler e invia di nuovo il messaggio
      unsubscribe();
      mockHandler.mockClear();
      
      messageCallback({
        data: validMessage
      } as MessageEvent);
      
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('dovrebbe gestire più handler per lo stesso tipo di messaggio', () => {
      const instance = WebviewDispatcher.getInstance();
      const mockHandler1 = vi.fn();
      const mockHandler2 = vi.fn();
      
      // Registra due handler
      instance.on('test-message', mockHandler1);
      instance.on('test-message', mockHandler2);
      
      // Simula un messaggio in arrivo
      messageCallback({
        data: validMessage
      } as MessageEvent);
      
      expect(mockHandler1).toHaveBeenCalledTimes(1);
      expect(mockHandler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('createValidator()', () => {
    it('dovrebbe creare un validator personalizzato per un tipo di messaggio', () => {
      const instance = WebviewDispatcher.getInstance();
      const validator = instance.createValidator('test-message', ['value']);
      
      const testMessage = {
        type: 'test-message',
        payload: { value: 'test' }
      };
      
      const result = validator(testMessage);
      expect(result.valid).toBe(true);
    });

    it('dovrebbe rifiutare messaggi che non soddisfano la validazione personalizzata', () => {
      const instance = WebviewDispatcher.getInstance();
      const validator = instance.createValidator('test-message', ['value']);
      
      const invalidTestMessage = {
        type: 'test-message',
        payload: { otherField: 'test' } // Manca il campo 'value'
      };
      
      const result = validator(invalidTestMessage);
      expect(result.valid).toBe(false);
    });

    it('dovrebbe utilizzare i validator personalizzati durante la gestione dei messaggi', () => {
      const instance = WebviewDispatcher.getInstance();
      const mockHandler = vi.fn();
      
      // Registra un validator personalizzato
      instance.createValidator('custom-message', ['requiredField']);
      
      // Registra l'handler
      instance.on('custom-message', mockHandler);
      
      // Messaggio valido
      const validCustomMessage = {
        type: 'custom-message',
        payload: { requiredField: 'present' }
      };
      
      // Messaggio non valido (manca requiredField)
      const invalidCustomMessage = {
        type: 'custom-message',
        payload: { otherField: 'value' }
      };
      
      // Simula messaggio valido
      messageCallback({
        data: validCustomMessage
      } as MessageEvent);
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
      
      mockHandler.mockClear();
      
      // Simula messaggio non valido
      messageCallback({
        data: invalidCustomMessage
      } as MessageEvent);
      
      expect(mockHandler).not.toHaveBeenCalled();
        });
    });
});

