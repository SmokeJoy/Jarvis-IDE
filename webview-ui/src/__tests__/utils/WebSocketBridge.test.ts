import { vi } from 'vitest';
/**
 * @file WebSocketBridge.test.ts
 * @description Test per il componente WebSocketBridge
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketBridge, WebSocketMessageType } from '../../utils/WebSocketBridge';
import * as messageUtils from '../../utils/messageUtils';

// Mock di getVSCodeAPI
vi.mock('../../utils/messageUtils', () => {
  return {
    getVSCodeAPI: vi.fn().mockReturnValue({
      postMessage: vi.fn()
    })
  };
});

// Mock delle console functions per i test
console.debug = vi.fn();
console.info = vi.fn();
console.warn = vi.fn();
console.error = vi.fn();

describe('WebSocketBridge', () => {
  let wsb: WebSocketBridge;
  let mockPostMessage: any;
  
  beforeEach(() => {
    // Reset dei mock prima di ogni test
    vi.clearAllMocks();
    
    // Mock di window.setInterval e window.clearInterval
    vi.spyOn(window, 'setInterval').mockImplementation((cb: any) => {
      return 123 as any;
    });
    vi.spyOn(window, 'clearInterval').mockImplementation(() => {});
    
    // Mock dell'event listener
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
    
    // Setup del mock per postMessage
    mockPostMessage = vi.fn();
    (messageUtils.getVSCodeAPI as any).mockReturnValue({
      postMessage: mockPostMessage
    });
    
    // Ottieni l'istanza di WebSocketBridge
    wsb = WebSocketBridge.getInstance();
  });
  
  afterEach(() => {
    // Cleanup
    if (wsb) {
      wsb.dispose();
    }
  });

  it('dovrebbe implementare correttamente il pattern Singleton', () => {
    // Ottieni un'altra istanza di WebSocketBridge
    const wsb2 = WebSocketBridge.getInstance();
    
    // Verifica che sia la stessa istanza
    expect(wsb).toBe(wsb2);
  });

  it('dovrebbe inviare un messaggio CONNECT durante l\'inizializzazione', () => {
    // Verifica che durante l'inizializzazione sia stato inviato un messaggio CONNECT
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WebSocketMessageType.CONNECT
      })
    );
  });

  it('dovrebbe utilizzare correttamente il Union Dispatcher pattern con postMessage<T>', () => {
    // Test per il metodo postMessage tipizzato
    const pingMessage = {
      type: WebSocketMessageType.PING,
      id: '123',
      timestamp: Date.now()
    };
    
    wsb.postMessage(pingMessage);
    
    // Verifica che il messaggio sia stato inviato correttamente
    expect(mockPostMessage).toHaveBeenCalledWith(pingMessage);
  });

  it('dovrebbe gestire correttamente i messaggi in arrivo con il dispatcher tipizzato', () => {
    // Crea un mock per il callback
    const mockCallback = vi.fn();
    
    // Registra il callback per i messaggi di tipo PONG
    wsb.on(WebSocketMessageType.PONG, mockCallback);
    
    // Simula un messaggio in arrivo
    const messageEvent = new MessageEvent('message', {
      data: {
        type: WebSocketMessageType.PONG,
        id: '123',
        timestamp: Date.now()
      }
    });
    
    // Ottieni il message handler
    const messageHandler = (window.addEventListener as any).mock.calls.find(
      call => call[0] === 'message'
    )[1];
    
    // Esegui il message handler
    messageHandler(messageEvent);
    
    // Verifica che il callback sia stato chiamato con il messaggio corretto
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WebSocketMessageType.PONG,
        id: '123'
      })
    );
  });

  it('dovrebbe rispondere automaticamente ai messaggi PING con messaggi PONG', () => {
    // Simula un messaggio PING in arrivo
    const pingMessage = {
      type: WebSocketMessageType.PING,
      id: '123',
      timestamp: Date.now()
    };
    
    const messageEvent = new MessageEvent('message', {
      data: pingMessage
    });
    
    // Ottieni il message handler
    const messageHandler = (window.addEventListener as any).mock.calls.find(
      call => call[0] === 'message'
    )[1];
    
    // Reset delle chiamate di mockPostMessage per avere un conteggio chiaro
    mockPostMessage.mockClear();
    
    // Esegui il message handler
    messageHandler(messageEvent);
    
    // Verifica che sia stato inviato un messaggio PONG in risposta
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WebSocketMessageType.PONG,
        id: '123'  // Lo stesso ID del messaggio PING
      })
    );
  });

  it('dovrebbe gestire correttamente la registrazione e rimozione di listener', () => {
    // Crea un mock per il callback
    const mockCallback = vi.fn();
    
    // Registra il callback
    const removeListener = wsb.on(WebSocketMessageType.LLM_STATUS, mockCallback);
    
    // Simula un messaggio in arrivo
    const messageEvent = new MessageEvent('message', {
      data: {
        type: WebSocketMessageType.LLM_STATUS,
        modelId: 'gpt-4',
        status: 'ready',
        timestamp: Date.now()
      }
    });
    
    // Ottieni il message handler
    const messageHandler = (window.addEventListener as any).mock.calls.find(
      call => call[0] === 'message'
    )[1];
    
    // Esegui il message handler
    messageHandler(messageEvent);
    
    // Verifica che il callback sia stato chiamato
    expect(mockCallback).toHaveBeenCalled();
    
    // Reset del mock
    mockCallback.mockClear();
    
    // Rimuovi il listener
    removeListener();
    
    // Esegui nuovamente il message handler
    messageHandler(messageEvent);
    
    // Verifica che il callback non sia stato chiamato questa volta
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('dovrebbe rimuovere tutti i listener con removeAllListeners', () => {
    // Crea diversi mock per i callback
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    
    // Registra i callback
    wsb.on(WebSocketMessageType.LLM_REQUEST, mockCallback1);
    wsb.on(WebSocketMessageType.LLM_RESPONSE, mockCallback2);
    
    // Rimuovi tutti i listener
    wsb.removeAllListeners();
    
    // Simula messaggi in arrivo
    const messageEvent1 = new MessageEvent('message', {
      data: {
        type: WebSocketMessageType.LLM_REQUEST,
        input: 'test',
        context: {}
      }
    });
    
    const messageEvent2 = new MessageEvent('message', {
      data: {
        type: WebSocketMessageType.LLM_RESPONSE,
        token: 'test',
        isComplete: true
      }
    });
    
    // Ottieni il message handler
    const messageHandler = (window.addEventListener as any).mock.calls.find(
      call => call[0] === 'message'
    )[1];
    
    // Esegui i message handler
    messageHandler(messageEvent1);
    messageHandler(messageEvent2);
    
    // Verifica che nessun callback sia stato chiamato
    expect(mockCallback1).not.toHaveBeenCalled();
    expect(mockCallback2).not.toHaveBeenCalled();
  });

  it('dovrebbe fare cleanup delle risorse con dispose', () => {
    // Esegui dispose
    wsb.dispose();
    
    // Verifica che gli intervalli siano stati puliti
    expect(window.clearInterval).toHaveBeenCalled();
    
    // Verifica che l'event listener sia stato rimosso
    expect(window.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    
    // Verifica che sia stato inviato un messaggio DISCONNECT
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WebSocketMessageType.DISCONNECT
      })
    );
  });

  it('dovrebbe gestire correttamente il metodo sendLlmMessage', () => {
    // Crea un messaggio LLM
    const llmRequestMessage = {
      type: WebSocketMessageType.LLM_REQUEST,
      input: 'Ciao, come stai?',
      context: {}
    };
    
    // Invia il messaggio
    wsb.sendLlmMessage(llmRequestMessage);
    
    // Verifica che il messaggio sia stato inviato correttamente
    expect(mockPostMessage).toHaveBeenCalledWith(llmRequestMessage);
  });
}); 

