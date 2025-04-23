import { vi } from 'vitest';
/**
 * @file WebviewManager.test.ts
 * @description Test suite per il WebviewManager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebviewManager, webviewManager } from './WebviewManager';
import { webviewDispatcher } from './WebviewDispatcher';
import { WebviewToExtensionMessageType, ExtensionToWebviewMessageType } from '../types/WebviewMessage';

// Mock del dispatcher
vi.mock('./WebviewDispatcher', () => {
  // Definiamo la cleanup function all'interno dello scope del mock
  const mockFn = vi.fn();
  
  return {
    webviewDispatcher: {
      sendMessage: vi.fn().mockReturnValue(true),
      on: vi.fn().mockImplementation(() => {
        // Ritorna la funzione di cleanup
        return mockFn;
      }),
    },
    // Esportiamo la cleanup function per poterla testare
    __mockCleanupFunction: mockFn
  };
});

// Recuperiamo la cleanup function dal mock
const { __mockCleanupFunction: mockCleanupFunction } = vi.mocked(await import('./WebviewDispatcher'));

// Mock del logger
vi.mock('./Logger', () => {
  return {
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('WebviewManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('dovrebbe essere un singleton', () => {
    // Otteniamo due istanze e verifichiamo che siano la stessa
    const instance1 = webviewManager;
    const instance2 = webviewManager;
    
    expect(instance1).toBe(instance2);
  });

  it('dovrebbe chiamare webviewDispatcher.sendMessage quando richiede le impostazioni', () => {
    webviewManager.requestSettings();
    
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledWith({
      type: WebviewToExtensionMessageType.GET_SETTINGS,
    });
  });

  it('dovrebbe chiamare webviewDispatcher.sendMessage quando aggiorna le impostazioni', () => {
    const testSettings = { apiKey: 'test-key', model: 'test-model' };
    webviewManager.updateSettings(testSettings);
    
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledWith({
      type: WebviewToExtensionMessageType.UPDATE_SETTINGS,
      payload: { settings: testSettings },
    });
  });

  it('dovrebbe chiamare webviewDispatcher.sendMessage quando invia un prompt', () => {
    const prompt = 'Test prompt';
    const options = { temperatura: 0.7 };
    webviewManager.sendPrompt(prompt, options);
    
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledWith({
      type: WebviewToExtensionMessageType.SEND_PROMPT,
      payload: { prompt, options },
    });
  });

  it('dovrebbe chiamare webviewDispatcher.sendMessage quando richiede la memoria dell\'agente', () => {
    const filters = { tag: 'test-tag' };
    webviewManager.requestAgentMemory(filters);
    
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledWith({
      type: WebviewToExtensionMessageType.GET_AGENT_MEMORY,
      payload: filters,
    });
  });

  it('dovrebbe chiamare webviewDispatcher.sendMessage senza payload quando richiede memoria agente senza filtri', () => {
    webviewManager.requestAgentMemory();
    
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledWith({
      type: WebviewToExtensionMessageType.GET_AGENT_MEMORY,
      payload: {},
    });
  });

  it('dovrebbe chiamare webviewDispatcher.sendMessage quando cancella la chat', () => {
    webviewManager.clearChat();
    
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledWith({
      type: WebviewToExtensionMessageType.CLEAR_CHAT,
    });
  });

  it('dovrebbe chiamare webviewDispatcher.sendMessage quando cancella l\'esecuzione corrente', () => {
    webviewManager.cancelCurrentExecution();
    
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.sendMessage).toHaveBeenCalledWith({
      type: WebviewToExtensionMessageType.CANCEL_EXECUTION,
    });
  });

  it('dovrebbe registrare un handler quando chiama onChatCompletion', () => {
    const handler = vi.fn();
    const unsubscribe = webviewManager.onChatCompletion(handler);
    
    expect(webviewDispatcher.on).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.on).toHaveBeenCalledWith(
      ExtensionToWebviewMessageType.MODEL_RESPONSE,
      handler
    );
    expect(unsubscribe).toBe(mockCleanupFunction);
  });

  it('dovrebbe registrare un handler quando chiama onAgentMemory', () => {
    const handler = vi.fn();
    const unsubscribe = webviewManager.onAgentMemory(handler);
    
    expect(webviewDispatcher.on).toHaveBeenCalledTimes(1);
    expect(webviewDispatcher.on).toHaveBeenCalledWith(
      ExtensionToWebviewMessageType.AGENT_MEMORY_RESPONSE,
      handler
    );
    expect(unsubscribe).toBe(mockCleanupFunction);
  });

  it('dovrebbe registrare un listener per le impostazioni durante l\'inizializzazione', () => {
    // Ricrea l'istanza per assicurarsi che il constructor venga chiamato
    // (senza influenzare l'istanza singleton originale)
    const WebviewManagerConstructorSpy = vi.spyOn(WebviewManager as any, 'getInstance');
    
    // Simula che il listener sia già stato registrato
    vi.mocked(webviewDispatcher.on).mockImplementation((type, handler) => {
      if (type === ExtensionToWebviewMessageType.SETTINGS_RESPONSE) {
        return mockCleanupFunction;
      }
      return vi.fn();
    });
    
    // Crea una nuova istanza (o recupera quella esistente, essendo un singleton)
    WebviewManager.getInstance();
    
    // Verifica che getInstance sia stato chiamato
    expect(WebviewManagerConstructorSpy).toHaveBeenCalled();
    
    // Verifica l'inizializzazione del listener
    expect(webviewDispatcher.on).toHaveBeenCalledWith(
      ExtensionToWebviewMessageType.SETTINGS_RESPONSE,
      expect.any(Function)
    );
  });
}); 