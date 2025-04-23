import { vi } from 'vitest';
import { vi, describe, it, expect, beforeEach, afterEach, test } from 'vitest';
import { WebSocketBridge } from '../utils/WebSocketBridge';
import { llmOrchestrator } from '../services/llmOrchestrator';
import type { ChatMessage, LLMProvider, LLMRequestOptions } from '../types/llm';

// Mock per il provider
const mockRequestCompletion = vi.fn();
const mockProvider: LLMProvider = {
  id: 'test-provider',
  name: 'Test Provider',
  isAvailable: true,
  requestCompletion: mockRequestCompletion,
  checkAvailability: vi.fn().mockResolvedValue(true)
};

// Mock per console.warn e console.error
let consoleWarnSpy: any;
let consoleErrorSpy: any;

describe('LLM Orchestrator Integration Tests', () => {
  let mockWebSocketBridge: Partial<WebSocketBridge>;
  const mockSend = vi.fn();
  
  beforeEach(() => {
    mockWebSocketBridge = {
      sendWebSocketMessage: mockSend,
      on: vi.fn()
    };
    
    // Mock singleton instance
    vi.spyOn(WebSocketBridge, 'getInstance').mockReturnValue(mockWebSocketBridge as WebSocketBridge);

    // Reset dei mock prima di ogni test
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Inizializzazione dell'orchestrator con un provider di test
    llmOrchestrator.executeRequest({
      context: { task: 'test' },
      input: 'test',
      onStream: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Pulizia degli spy dopo ogni test
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('should handle complete LLM_REQUEST flow with stream', async () => {
    // Simula risposta dello stream LLM
    const mockResponseHandler = vi.fn();
    const testContext = { task: 'test', params: {} };
    
    // Avvia richiesta
    llmOrchestrator.executeRequest({
      context: testContext,
      input: 'test input',
      onStream: mockResponseHandler
    });

    // Verifica invio messaggio LLM_REQUEST
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      type: 'LLM_REQUEST',
      context: testContext,
      input: 'test input'
    }));

    // Simula risposta parziale
    const mockPartialResponse = {
      type: 'LLM_RESPONSE',
      token: 'partial',
      isComplete: false
    };
    vi.mocked(WebSocketBridge).__triggerMockMessage(mockPartialResponse);
    
    expect(mockResponseHandler).toHaveBeenCalledWith('partial', false);

    // Simula risposta finale
    const mockFinalResponse = {
      type: 'LLM_RESPONSE',
      token: 'final',
      isComplete: true
    };
    vi.mocked(WebSocketBridge).__triggerMockMessage(mockFinalResponse);
    
    expect(mockResponseHandler).toHaveBeenCalledWith('final', true);
  });

  test('should handle LLM_CANCEL command', async () => {
    const abortController = new AbortController();
    
    llmOrchestrator.executeRequest({
      context: { task: 'test' },
      input: 'test',
      signal: abortController.signal
    });

    // Trigger manual abort
    abortController.abort();
    
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      type: 'LLM_CANCEL'
    }));
  });

  test('should handle invalid messages gracefully', () => {
    // Trigger invalid message
    vi.mocked(WebSocketBridge).__triggerMockMessage({
      type: 'INVALID_TYPE'
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Errore nel messaggio WebSocket:',
      expect.any(Error)
    );
  });

  test('should throw error if AbortController is missing', () => {
    expect(() => {
      llmOrchestrator.executeRequest({
        context: { task: 'test' },
        input: 'test',
        signal: undefined
      });
    }).toThrow('AbortController non configurato');
  });

  it('dovrebbe inizializzare correttamente con un provider', () => {
    expect(llmOrchestrator.getProvider('test-provider')).toBe(mockProvider);
  });

  it('dovrebbe restituire null per un provider non esistente', () => {
    expect(llmOrchestrator.getProvider('non-existent')).toBeNull();
  });

  it('dovrebbe registrare un warning quando si richiede un provider non disponibile', async () => {
    mockProvider.isAvailable = false;
    
    await llmOrchestrator.requestCompletion({
      messages: [{ role: 'user', content: 'Test message' }],
      provider: 'test-provider'
    });
    
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('dovrebbe utilizzare correttamente il provider specificato', async () => {
    mockRequestCompletion.mockResolvedValue({
      content: 'Test response',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    });
    
    const result = await llmOrchestrator.requestCompletion({
      messages: [{ role: 'user', content: 'Test message' }],
      provider: 'test-provider'
    });
    
    expect(mockRequestCompletion).toHaveBeenCalled();
    expect(result.content).toBe('Test response');
  });

  it('dovrebbe passare correttamente tutte le opzioni al provider', async () => {
    mockRequestCompletion.mockResolvedValue({
      content: 'Test response',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    });
    
    const options: LLMRequestOptions = {
      messages: [{ role: 'user', content: 'Test message' }],
      provider: 'test-provider',
      temperature: 0.7,
      max_tokens: 500,
      model: 'test-model'
    };
    
    await llmOrchestrator.requestCompletion(options);
    
    expect(mockRequestCompletion).toHaveBeenCalledWith(
      options.messages, 
      expect.objectContaining({
        temperature: 0.7,
        max_tokens: 500,
        model: 'test-model'
      })
    );
  });

  it('dovrebbe gestire correttamente gli errori dal provider', async () => {
    const errorMessage = 'Test error';
    mockRequestCompletion.mockRejectedValue(new Error(errorMessage));
    
    await expect(llmOrchestrator.requestCompletion({
      messages: [{ role: 'user', content: 'Test message' }],
      provider: 'test-provider'
    })).rejects.toThrow(errorMessage);
    
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('dovrebbe controllare la disponibilità dei provider all\'inizializzazione', async () => {
    const checkAvailabilitySpy = vi.spyOn(mockProvider, 'checkAvailability');
    
    // Crea un nuovo orchestrator che dovrebbe verificare la disponibilità
    llmOrchestrator.executeRequest({
      context: { task: 'test' },
      input: 'test',
      onStream: vi.fn(),
      checkAvailability: true
    });
    
    expect(checkAvailabilitySpy).toHaveBeenCalled();
  });

  it('dovrebbe aggiornare lo stato di disponibilità dopo il controllo', async () => {
    // Imposta il provider come non disponibile inizialmente
    mockProvider.isAvailable = false;
    mockProvider.checkAvailability = vi.fn().mockResolvedValue(true);
    
    // Crea un nuovo orchestrator e verifica che aggiorni lo stato
    llmOrchestrator.executeRequest({
      context: { task: 'test' },
      input: 'test',
      onStream: vi.fn(),
      checkAvailability: true
    });
    
    // Attendiamo che il controllo di disponibilità venga completato
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Il provider dovrebbe ora essere disponibile
    expect(mockProvider.isAvailable).toBe(true);
  });

  it('dovrebbe gestire correttamente il fallimento del controllo di disponibilità', async () => {
    // Imposta il provider come disponibile inizialmente
    mockProvider.isAvailable = true;
    mockProvider.checkAvailability = vi.fn().mockRejectedValue(new Error('Connection failed'));
    
    // Crea un nuovo orchestrator e verifica che aggiorni lo stato
    llmOrchestrator.executeRequest({
      context: { task: 'test' },
      input: 'test',
      onStream: vi.fn(),
      checkAvailability: true
    });
    
    // Attendiamo che il controllo di disponibilità venga completato
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Il provider dovrebbe ora essere non disponibile
    expect(mockProvider.isAvailable).toBe(false);
  });
});

