import { vi } from 'vitest';
/**
 * @file WebviewDispatcher.test.ts
 * @description Test per la classe WebviewDispatcher
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webviewDispatcher } from './WebviewDispatcher';
import { BaseMessage } from '../../src/shared/types/base-message';

// Mock del modulo WebviewBridge
vi.mock('./utils/WebviewBridge', () => {
  const mockSendMessage = vi.fn().mockReturnValue(true);
  const mockHandlers = new Set<(message: unknown) => void>();

  return {
    webviewBridge: {
      sendMessage: mockSendMessage,
      onAny: vi.fn().mockImplementation((handler: (message: unknown) => void) => {
        mockHandlers.add(handler);
      }),
      offAny: vi.fn().mockImplementation((handler: (message: unknown) => void) => {
        mockHandlers.delete(handler);
      }),
      // Funzione di aiuto per testare l'emissione di messaggi
      __mockEmitMessage: (message: unknown) => {
        mockHandlers.forEach(handler => handler(message));
      },
      __getMockHandlers: () => mockHandlers,
      __resetMockHandlers: () => mockHandlers.clear()
    },
  };
});

// Mock del modulo Logger
vi.mock('./utils/Logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Recupera il modulo mockato
const webviewBridgeMock = await import('./utils/WebviewBridge');

describe('WebviewDispatcher', () => {
  beforeEach(() => {
    // Reset del dispatcher prima di ogni test
    webviewDispatcher.dispose();
    webviewDispatcher.initialize();
    
    // Reset dei mock
    vi.clearAllMocks();
    (webviewBridgeMock.webviewBridge as any).__resetMockHandlers();
  });

  afterEach(() => {
    webviewDispatcher.dispose();
  });

  it('dovrebbe inizializzare correttamente', () => {
    expect(webviewDispatcher).toBeDefined();
    // Verifica che onAny sia stato chiamato
    expect(webviewBridgeMock.webviewBridge.onAny).toHaveBeenCalled();
  });

  it('dovrebbe registrare un handler e ricevere messaggi', () => {
    const mockHandler = vi.fn();
    const testMessage: BaseMessage<string, { data: string }> = {
      type: 'test',
      payload: { data: 'test-data' }
    };

    // Registra l'handler
    const registration = webviewDispatcher.on('test', mockHandler);
    expect(registration).toBeDefined();
    expect(registration.unsubscribe).toBeTypeOf('function');

    // Emula la ricezione di un messaggio
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(testMessage);

    // Verifica che l'handler sia stato chiamato con il messaggio corretto
    expect(mockHandler).toHaveBeenCalledWith(testMessage);
  });

  it('dovrebbe filtrare i messaggi per tipo', () => {
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();
    
    const testMessage1: BaseMessage<string, { data: string }> = {
      type: 'test1',
      payload: { data: 'data1' }
    };
    
    const testMessage2: BaseMessage<string, { data: string }> = {
      type: 'test2',
      payload: { data: 'data2' }
    };

    // Registra gli handler per tipi diversi
    webviewDispatcher.on('test1', mockHandler1);
    webviewDispatcher.on('test2', mockHandler2);

    // Emula la ricezione dei messaggi
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(testMessage1);
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(testMessage2);

    // Verifica che gli handler siano stati chiamati solo per i messaggi del tipo corrispondente
    expect(mockHandler1).toHaveBeenCalledWith(testMessage1);
    expect(mockHandler1).toHaveBeenCalledTimes(1);
    
    expect(mockHandler2).toHaveBeenCalledWith(testMessage2);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
  });

  it('dovrebbe annullare la registrazione di un handler', () => {
    const mockHandler = vi.fn();
    const testMessage: BaseMessage<string, { data: string }> = {
      type: 'test',
      payload: { data: 'test-data' }
    };

    // Registra l'handler
    const registration = webviewDispatcher.on('test', mockHandler);
    
    // Annulla la registrazione
    registration.unsubscribe();
    
    // Emula la ricezione di un messaggio
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(testMessage);
    
    // Verifica che l'handler non sia stato chiamato
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('dovrebbe rimuovere un handler specifico', () => {
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();
    const testMessage: BaseMessage<string, { data: string }> = {
      type: 'test',
      payload: { data: 'test-data' }
    };

    // Registra due handler per lo stesso tipo
    webviewDispatcher.on('test', mockHandler1);
    webviewDispatcher.on('test', mockHandler2);
    
    // Rimuove solo il primo handler
    webviewDispatcher.off('test', mockHandler1);
    
    // Emula la ricezione di un messaggio
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(testMessage);
    
    // Verifica che solo il secondo handler sia stato chiamato
    expect(mockHandler1).not.toHaveBeenCalled();
    expect(mockHandler2).toHaveBeenCalledWith(testMessage);
  });

  it('dovrebbe rimuovere tutti gli handler per un tipo', () => {
    const mockHandler1 = vi.fn();
    const mockHandler2 = vi.fn();
    const testMessage: BaseMessage<string, { data: string }> = {
      type: 'test',
      payload: { data: 'test-data' }
    };

    // Registra due handler per lo stesso tipo
    webviewDispatcher.on('test', mockHandler1);
    webviewDispatcher.on('test', mockHandler2);
    
    // Rimuove tutti gli handler per il tipo 'test'
    webviewDispatcher.offAll('test');
    
    // Emula la ricezione di un messaggio
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(testMessage);
    
    // Verifica che nessun handler sia stato chiamato
    expect(mockHandler1).not.toHaveBeenCalled();
    expect(mockHandler2).not.toHaveBeenCalled();
  });

  it('dovrebbe inviare messaggi tramite webviewBridge', () => {
    const testMessage: BaseMessage<string, { data: string }> = {
      type: 'test',
      payload: { data: 'test-data' }
    };

    // Invia un messaggio
    const result = webviewDispatcher.sendMessage(testMessage);
    
    // Verifica che il messaggio sia stato inviato tramite webviewBridge
    expect(result).toBe(true);
    expect(webviewBridgeMock.webviewBridge.sendMessage).toHaveBeenCalledWith(testMessage);
  });

  it('dovrebbe ignorare messaggi non validi', () => {
    const mockHandler = vi.fn();
    const invalidMessage = { invalid: 'message' };

    // Registra l'handler
    webviewDispatcher.on('test', mockHandler);
    
    // Emula la ricezione di un messaggio non valido
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(invalidMessage);
    
    // Verifica che l'handler non sia stato chiamato
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('dovrebbe utilizzare un validatore personalizzato', () => {
    const mockHandler = vi.fn();
    const testMessage: BaseMessage<string, { count: number }> = {
      type: 'test',
      payload: { count: 5 }
    };

    // Validatore personalizzato che accetta solo messaggi con count > 10
    const customValidator = (message: unknown): boolean => {
      if (typeof message !== 'object' || message === null) return false;
      const typedMessage = message as BaseMessage<string, { count: number }>;
      return typedMessage.payload?.count > 10;
    };

    // Registra l'handler con il validatore personalizzato
    webviewDispatcher.on('test', mockHandler, customValidator);
    
    // Emula la ricezione di un messaggio che non passa la validazione
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(testMessage);
    
    // Verifica che l'handler non sia stato chiamato
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Modifica il messaggio per passare la validazione
    const validMessage: BaseMessage<string, { count: number }> = {
      type: 'test',
      payload: { count: 15 }
    };
    
    // Emula la ricezione di un messaggio che passa la validazione
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(validMessage);
    
    // Verifica che l'handler sia stato chiamato
    expect(mockHandler).toHaveBeenCalledWith(validMessage);
  });

  it('dovrebbe gestire gli errori nei gestori di messaggi', () => {
    const errorMessage = 'Handler error';
    const mockHandler = vi.fn().mockImplementation(() => {
      throw new Error(errorMessage);
    });
    
    const testMessage: BaseMessage<string, { data: string }> = {
      type: 'test',
      payload: { data: 'test-data' }
    };

    // Registra l'handler che genererà un errore
    webviewDispatcher.on('test', mockHandler);
    
    // Emula la ricezione di un messaggio
    (webviewBridgeMock.webviewBridge as any).__mockEmitMessage(testMessage);
    
    // Verifica che l'handler sia stato chiamato
    expect(mockHandler).toHaveBeenCalled();
    
    // Verifica che il logger abbia registrato l'errore
    const loggerMock = (await import('./utils/Logger')).logger;
    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in handler for message type test:'),
      expect.any(Error)
    );
  });
}); 