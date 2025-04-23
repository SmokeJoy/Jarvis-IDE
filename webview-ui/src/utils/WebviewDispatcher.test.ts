import { vi } from 'vitest';
/**
 * @file WebviewDispatcher.test.ts
 * @description Test per il WebviewDispatcher
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebviewDispatcher, webviewDispatcher, BaseMessage } from './WebviewDispatcher';
import { MessageValidationResult } from './validate';

// Mock di window per simulare il comportamento di VS Code
const mockPostMessage = vi.fn();
Object.defineProperty(window, 'acquireVsCodeApi', {
  value: vi.fn(() => ({
    postMessage: mockPostMessage,
  })),
  writable: true,
});

describe('WebviewDispatcher', () => {
  // Reset dei mock prima di ogni test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Pulizia dopo ogni test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dovrebbe essere un singleton', () => {
    const instance1 = WebviewDispatcher.getInstance();
    const instance2 = WebviewDispatcher.getInstance();
    expect(instance1).toBe(instance2);
    expect(instance1).toBe(webviewDispatcher);
  });

  it('dovrebbe aggiungere un listener al caricamento e rimuoverlo alla dispose', () => {
    // Aggiungiamo uno spy su addEventListener e removeEventListener
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    // Creiamo una nuova istanza per testare l'inizializzazione
    const dispatcher = new (WebviewDispatcher as any)();
    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    
    // Testiamo la dispose
    dispatcher.dispose();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('dovrebbe inviare messaggi validi con successo', () => {
    const message: BaseMessage = {
      type: 'test',
      payload: { data: 'test' }
    };
    
    const result = webviewDispatcher.sendMessage(message);
    
    expect(result).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledWith(message);
  });

  it('non dovrebbe inviare messaggi non validi', () => {
    const invalidMessage = {
      // Manca il tipo, quindi non valido
      payload: { data: 'test' }
    };
    
    // @ts-ignore - Testiamo un caso di uso errato
    const result = webviewDispatcher.sendMessage(invalidMessage);
    
    expect(result).toBe(false);
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('dovrebbe registrare e chiamare gli handler per messaggi specifici', () => {
    const handler = vi.fn();
    const messageType = 'testType';
    const payload = { data: 'testData' };
    
    // Registra l'handler
    const unsubscribe = webviewDispatcher.on(messageType, handler);
    
    // Simula l'arrivo di un messaggio
    const messageEvent = new MessageEvent('message', {
      data: {
        type: messageType,
        payload
      }
    });
    
    window.dispatchEvent(messageEvent);
    
    // Verifica che l'handler sia stato chiamato con il payload
    expect(handler).toHaveBeenCalledWith(payload);
    
    // Verifica la rimozione dell'handler
    unsubscribe();
    
    // Reset del mock
    handler.mockReset();
    
    // Simula un altro messaggio dello stesso tipo
    window.dispatchEvent(messageEvent);
    
    // L'handler non dovrebbe essere chiamato dopo l'unsubscribe
    expect(handler).not.toHaveBeenCalled();
  });

  it('dovrebbe loggare un warning se riceve un messaggio senza handler', () => {
    // Mock della funzione logger.warn
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Simula un messaggio per cui non c'è handler
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'unknownType',
        payload: {}
      }
    });
    
    window.dispatchEvent(messageEvent);
    
    // Ci aspettiamo che sia stato loggato un warning
    // Nota: in un'implementazione reale controlleremmo il logger specifico dell'applicazione
    expect(warnSpy).toHaveBeenCalled();
  });

  it('dovrebbe creare e usare validator personalizzati', () => {
    const messageType = 'customValidated';
    const requiredFields = ['field1', 'field2'];
    
    // Crea un validator personalizzato
    webviewDispatcher.createValidator(messageType, requiredFields);
    
    // Messaggio valido con i campi richiesti
    const validMessage = {
      type: messageType,
      payload: { field1: 'value1', field2: 'value2' }
    };
    
    const handler = vi.fn();
    webviewDispatcher.on(messageType, handler);
    
    // Simula un messaggio valido
    const validEvent = new MessageEvent('message', { data: validMessage });
    window.dispatchEvent(validEvent);
    
    // L'handler dovrebbe essere chiamato per un messaggio valido
    expect(handler).toHaveBeenCalledWith(validMessage.payload);
    
    // Reset del mock
    handler.mockReset();
    
    // Messaggio non valido (manca field2)
    const invalidMessage = {
      type: messageType,
      payload: { field1: 'value1' }
    };
    
    // Simula un messaggio non valido
    const invalidEvent = new MessageEvent('message', { data: invalidMessage });
    window.dispatchEvent(invalidEvent);
    
    // L'handler non dovrebbe essere chiamato per un messaggio non valido
    expect(handler).not.toHaveBeenCalled();
  });
}); 