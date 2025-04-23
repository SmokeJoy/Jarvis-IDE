import { vi } from 'vitest';
import { beforeAll, afterEach, describe, expect, test, vi } from 'vitest';
import { WebviewMessage, ExtensionMessage, WebviewMessageType } from '../../../src/shared/types/webview.types';
import { 
  isValidWebviewMessage,
  isValidExtensionMessage,
  sendMessageToExtension,
  createMessageListener,
  createMessage
} from '../utils/messageUtils';

// Mock del modulo i18n
vi.mock('../i18n', () => ({
  t: (key: string) => key // Ritorna semplicemente la chiave per semplificare i test
}));

// Mock del VSCode API
const mockPostMessage = vi.fn();
const mockGetState = vi.fn().mockReturnValue({});
const mockSetState = vi.fn();

// Mock per window.addEventListener e removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Setup dei mock globali
beforeAll(() => {
  // Mock per acquireVsCodeApi
  (global as any).acquireVsCodeApi = vi.fn().mockReturnValue({
    postMessage: mockPostMessage,
    getState: mockGetState,
    setState: mockSetState
  });
  
  // Mock per window.addEventListener e removeEventListener
  Object.defineProperty(global, 'window', {
    value: {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener
    },
    writable: true
  });
  
  // Mock per console.log, debug, warn, error
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Reset dei mock tra i test
afterEach(() => {
  vi.clearAllMocks();
});

describe('Funzione isValidWebviewMessage', () => {
  test('dovrebbe riconoscere un WebviewMessage valido', () => {
    const validMessage: WebviewMessage = {
      type: WebviewMessageType.SEND_PROMPT,
      payload: { prompt: 'Test message' }
    };
    
    expect(isValidWebviewMessage(validMessage)).toBe(true);
  });
  
  test('dovrebbe rifiutare un messaggio senza type', () => {
    const invalidMessage = {
      payload: { prompt: 'Test message' }
    };
    
    expect(isValidWebviewMessage(invalidMessage)).toBe(false);
  });
  
  test('dovrebbe rifiutare un messaggio con type non stringa', () => {
    const invalidMessage = {
      type: 123,
      payload: { prompt: 'Test message' }
    };
    
    expect(isValidWebviewMessage(invalidMessage)).toBe(false);
  });
  
  test('dovrebbe rifiutare null o undefined', () => {
    expect(isValidWebviewMessage(null)).toBe(false);
    expect(isValidWebviewMessage(undefined)).toBe(false);
  });
  
  test('dovrebbe rifiutare tipi primitivi', () => {
    expect(isValidWebviewMessage(123)).toBe(false);
    expect(isValidWebviewMessage('string')).toBe(false);
    expect(isValidWebviewMessage(true)).toBe(false);
  });
});

describe('Funzione isValidExtensionMessage', () => {
  test('dovrebbe riconoscere un ExtensionMessage valido', () => {
    const validMessage: ExtensionMessage = {
      type: 'response',
      message: 'Test response'
    };
    
    expect(isValidExtensionMessage(validMessage)).toBe(true);
  });
  
  test('dovrebbe rifiutare un messaggio senza type', () => {
    const invalidMessage = {
      message: 'Test response'
    };
    
    expect(isValidExtensionMessage(invalidMessage)).toBe(false);
  });
  
  test('dovrebbe rifiutare un messaggio con type non stringa', () => {
    const invalidMessage = {
      type: 123,
      message: 'Test response'
    };
    
    expect(isValidExtensionMessage(invalidMessage)).toBe(false);
  });
  
  test('dovrebbe rifiutare null o undefined', () => {
    expect(isValidExtensionMessage(null)).toBe(false);
    expect(isValidExtensionMessage(undefined)).toBe(false);
  });
  
  test('dovrebbe rifiutare tipi primitivi', () => {
    expect(isValidExtensionMessage(123)).toBe(false);
    expect(isValidExtensionMessage('string')).toBe(false);
    expect(isValidExtensionMessage(true)).toBe(false);
  });
});

describe('Funzione sendMessageToExtension', () => {
  test('dovrebbe inviare un messaggio valido', () => {
    const validMessage: WebviewMessage = {
      type: WebviewMessageType.SEND_PROMPT,
      payload: { prompt: 'Test message' }
    };
    
    sendMessageToExtension(validMessage);
    
    expect(mockPostMessage).toHaveBeenCalledWith(validMessage);
  });
  
  test('dovrebbe lanciare un errore per messaggio non valido', () => {
    const invalidMessage = {
      payload: { prompt: 'Test message' }
    };
    
        expect(() => sendMessageToExtension(invalidMessage)).toThrow();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
  
  test('dovrebbe gestire errori durante l\'invio', () => {
    // Simuliamo un errore durante l'invio
    mockPostMessage.mockImplementationOnce(() => {
      throw new Error('Network error');
    });
    
    const validMessage: WebviewMessage = {
      type: WebviewMessageType.SEND_PROMPT,
      payload: { prompt: 'Test message' }
    };
    
    expect(() => sendMessageToExtension(validMessage)).toThrow();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('Funzione createMessageListener', () => {
  test('dovrebbe registrare un listener per i messaggi', () => {
    const mockCallback = vi.fn();
    
    const removeListener = createMessageListener(mockCallback);
    
    expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(typeof removeListener).toBe('function');
  });
  
  test('dovrebbe rimuovere il listener quando chiamato', () => {
    const mockCallback = vi.fn();
    
    const removeListener = createMessageListener(mockCallback);
    removeListener();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });
  
  test('dovrebbe chiamare il callback solo per messaggi validi', () => {
    const mockCallback = vi.fn();
    
    createMessageListener(mockCallback);
    
    // Estrai la funzione handler registrata
    const handler = mockAddEventListener.mock.calls[0][1];
    
    // Simuliamo un messaggio valido
    const validMessage: ExtensionMessage = {
      type: 'response',
      message: 'Test response'
    };
    
    // Simuliamo un messaggio non valido
    const invalidMessage = {
      data: 'Not a valid message'
    };
    
    // Chiamiamo l'handler con un messaggio valido
    handler({ data: validMessage });
    expect(mockCallback).toHaveBeenCalledWith(validMessage);
    
    // Chiamiamo l'handler con un messaggio non valido
    handler({ data: invalidMessage });
    expect(mockCallback).toHaveBeenCalledTimes(1); // Non dovrebbe essere chiamato di nuovo
    
    // Verifichiamo che sia stato generato un warning
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('Funzione factory createMessage', () => {
  test('dovrebbe creare un messaggio getSettings', () => {
    const message = createMessage.getSettings();
    
    expect(message).toEqual({
      type: WebviewMessageType.GET_SETTINGS
    });
  });
  
  test('dovrebbe creare un messaggio saveSettings', () => {
    const settings = { theme: 'dark', fontSize: 14 };
    const message = createMessage.saveSettings(settings);
    
    expect(message).toEqual({
      type: WebviewMessageType.SAVE_SETTINGS,
      payload: settings
    });
  });
  
  test('dovrebbe creare un messaggio chatRequest', () => {
    const prompt = 'Test prompt';
    const options = { model: 'gpt-4' };
    const message = createMessage.chatRequest(prompt, options);
    
    expect(message).toEqual({
      type: WebviewMessageType.SEND_PROMPT,
      payload: {
        prompt,
        model: 'gpt-4'
      }
    });
  });
  
  test('dovrebbe creare un messaggio clearChat', () => {
    const message = createMessage.clearChat();
    
    expect(message).toEqual({
      type: WebviewMessageType.CLEAR_CHAT_HISTORY
    });
  });
  
  test('dovrebbe creare un messaggio exportChat', () => {
    const format = 'markdown';
    const message = createMessage.exportChat(format);
    
    expect(message).toEqual({
      type: WebviewMessageType.EXPORT_CHAT_HISTORY,
      payload: { format }
    });
  });
  
  test('dovrebbe creare un messaggio selectFiles', () => {
    const message = createMessage.selectFiles();
    
    expect(message).toEqual({
      type: WebviewMessageType.SELECT_IMAGES
    });
  });
}); 

