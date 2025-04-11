import { WebviewMessage, ExtensionMessage } from '../../../src/shared/types/webview.types';
import { webviewBridge } from '../utils/WebviewBridge';

// Import dei mock
import * as messageUtils from '../utils/messageUtils';

// Mock delle dipendenze
import { afterEach, beforeEach, describe, expect, it, vi, test } from 'vitest';

// Mock per i metodi
const mockPostMessage = vi.fn();
const mockGetVSCodeAPI = vi.fn().mockReturnValue({
  postMessage: mockPostMessage
});

// Cast del mock per TypeScript
const mockedGetVSCodeAPI = messageUtils.getVSCodeAPI as ReturnType<typeof vi.fn<typeof messageUtils.getVSCodeAPI>>;
const mockedIsValidWebviewMessage = messageUtils.isValidWebviewMessage as ReturnType<typeof vi.fn<typeof messageUtils.isValidWebviewMessage>>;
const mockedIsValidExtensionMessage = messageUtils.isValidExtensionMessage as ReturnType<typeof vi.fn<typeof messageUtils.isValidExtensionMessage>>;

// Mock per window.addEventListener e removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Setup dei mock globali
beforeEach(() => {
  // Reset dei mock
  vi.clearAllMocks();
  
  // Setup dei mock per i test
  mockedGetVSCodeAPI.mockImplementation(mockGetVSCodeAPI);
  mockedIsValidWebviewMessage.mockImplementation((message) => !!message && typeof message === 'object' && 'type' in message);
  mockedIsValidExtensionMessage.mockImplementation((message) => !!message && typeof message === 'object' && 'type' in message);
  
  // Mock per window
  Object.defineProperty(global, 'window', {
    value: {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener
    },
    writable: true
  });
  
  // Mock per console
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

describe('WebviewBridge', () => {
  afterEach(() => {
    // Garantire pulizia dopo ogni test
    vi.restoreAllMocks();
  });
  
  test('dovrebbe registrare un event listener al momento della creazione', () => {
    // Il constructor di WebviewBridge è già stato chiamato all'import
    expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });
  
  test('dovrebbe inviare messaggi correttamente', () => {
    const testMessage: WebviewMessage = {
      type: 'testMessage',
      payload: { test: 'data' }
    };
    
    webviewBridge.sendMessage(testMessage);
    
    expect(mockedGetVSCodeAPI).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalledWith(testMessage);
  });
  
  test('dovrebbe lanciare un errore per messaggi non validi', () => {
    // Modifichiamo il mock per simulare un messaggio non valido
    mockedIsValidWebviewMessage.mockReturnValueOnce(false);
    
    const invalidMessage = { 
      payload: 'invalid' 
    } as any;
    
    expect(() => webviewBridge.sendMessage(invalidMessage)).toThrow();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
  
  test('dovrebbe registrare callback per tipi di messaggio specifici', () => {
    const callback = vi.fn();
    const messageType = 'testType';
    
    const removeListener = webviewBridge.on(messageType, callback);
    
    // Simuliamo la ricezione di un messaggio
    const handler = mockAddEventListener.mock.calls[0][1];
    
    const testMessage: ExtensionMessage = {
      type: messageType,
      content: 'test content'
    };
    
    // Inviamo un messaggio del tipo corretto
    handler({ data: testMessage });
    
    expect(callback).toHaveBeenCalledWith(testMessage);
    expect(typeof removeListener).toBe('function');
  });
  
  test('dovrebbe ignorare messaggi di tipo diverso', () => {
    const callback = vi.fn();
    const messageType = 'testType';
    
    webviewBridge.on(messageType, callback);
    
    // Simuliamo la ricezione di un messaggio
    const handler = mockAddEventListener.mock.calls[0][1];
    
    const differentTypeMessage: ExtensionMessage = {
      type: 'differentType',
      content: 'different content'
    };
    
    // Inviamo un messaggio di tipo diverso
    handler({ data: differentTypeMessage });
    
    expect(callback).not.toHaveBeenCalled();
  });
  
  test('dovrebbe ignorare messaggi non validi', () => {
    const callback = vi.fn();
    const messageType = 'testType';
    
    webviewBridge.on(messageType, callback);
    
    // Simuliamo la ricezione di un messaggio
    const handler = mockAddEventListener.mock.calls[0][1];
    
    // Settiamo il mock per invalidare il messaggio
    mockedIsValidExtensionMessage.mockReturnValueOnce(false);
    
    // Inviamo un messaggio non valido
    handler({ data: { invalid: 'message' } });
    
    expect(callback).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });
  
  test('dovrebbe rimuovere un listener specifico', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const messageType = 'testType';
    
    const removeListener = webviewBridge.on(messageType, callback1);
    webviewBridge.on(messageType, callback2);
    
    // Rimuoviamo il primo listener
    removeListener();
    
    // Simuliamo la ricezione di un messaggio
    const handler = mockAddEventListener.mock.calls[0][1];
    
    const testMessage: ExtensionMessage = {
      type: messageType,
      content: 'test content'
    };
    
    // Inviamo un messaggio
    handler({ data: testMessage });
    
    // Solo il secondo callback dovrebbe essere chiamato
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith(testMessage);
  });
  
  test('dovrebbe rimuovere tutti i listener per un tipo', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const messageType = 'testType';
    
    webviewBridge.on(messageType, callback1);
    webviewBridge.on(messageType, callback2);
    
    // Rimuoviamo tutti i listener per quel tipo
    webviewBridge.off(messageType);
    
    // Simuliamo la ricezione di un messaggio
    const handler = mockAddEventListener.mock.calls[0][1];
    
    const testMessage: ExtensionMessage = {
      type: messageType,
      content: 'test content'
    };
    
    // Inviamo un messaggio
    handler({ data: testMessage });
    
    // Nessun callback dovrebbe essere chiamato
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
  
  test('dovrebbe rimuovere tutti i listener', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    
    webviewBridge.on('type1', callback1);
    webviewBridge.on('type2', callback2);
    
    // Rimuoviamo tutti i listener
    webviewBridge.removeAllListeners();
    
    // Simuliamo la ricezione di messaggi
    const handler = mockAddEventListener.mock.calls[0][1];
    
    const message1: ExtensionMessage = {
      type: 'type1',
      content: 'content 1'
    };
    
    const message2: ExtensionMessage = {
      type: 'type2',
      content: 'content 2'
    };
    
    // Inviamo i messaggi
    handler({ data: message1 });
    handler({ data: message2 });
    
    // Nessun callback dovrebbe essere chiamato
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
  
  test('dovrebbe fare cleanup alla dispose', () => {
    webviewBridge.dispose();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });
  
  test('dovrebbe gestire errori nei callback', () => {
    const errorCallback = vi.fn().mockImplementation(() => {
      throw new Error('Callback error');
    });
    
    webviewBridge.on('errorType', errorCallback);
    
    // Simuliamo la ricezione di un messaggio
    const handler = mockAddEventListener.mock.calls[0][1];
    
    const testMessage: ExtensionMessage = {
      type: 'errorType',
      content: 'error content'
    };
    
    // Non dovrebbe generare un'eccezione non gestita
    expect(() => {
      handler({ data: testMessage });
    }).not.toThrow();
    
    // Il callback dovrebbe essere stato chiamato
    expect(errorCallback).toHaveBeenCalled();
    
    // Dovrebbe essere stato registrato l'errore
    expect(console.error).toHaveBeenCalled();
  });
}); 

