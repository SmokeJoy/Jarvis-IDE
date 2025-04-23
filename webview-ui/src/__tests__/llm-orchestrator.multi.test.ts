import { vi } from 'vitest';
/**
 * @file llm-orchestrator.multi.test.ts
 * @description Test per l'orchestratore LLM con supporto multi-provider
 * @version 2.1.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ProviderRegistry,
  LLMProviderHandler,
  LLMProviderId,
  LLMRequestOptions,
  registerProvider
} from '../../tests/mocks/provider-registry';
import { 
  LLMOrchestrator, 
  OrchestratorOptions, 
  OrchestratorResult 
} from '../../tests/mocks/llm-orchestrator';
import { LLMOrchestrator as NewLLMOrchestrator } from '../services/llmOrchestrator';
import { LLMProvider } from '../../../src/providers/provider-registry';
import { WebSocketBridge } from '../utils/WebSocketBridge';

// Disabilita console.log durante i test
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  // Reset singleton
  ProviderRegistry.reset();
});

// Mock del logger per verificare i messaggi
const mockLogger = vi.fn();

// Mockare le dipendenze
vi.mock('../utils/WebSocketBridge');
vi.mock('../../../src/providers/provider-registry');

/**
 * Factory per creare provider di test
 */
function createMockProvider(
  id: LLMProviderId, 
  options: { 
    shouldFail?: boolean; 
    responseTime?: number; 
    isAvailable?: boolean;
    responsePrefix?: string;
  } = {}
): LLMProviderHandler {
  const {
    shouldFail = false,
    responseTime = 50,
    isAvailable = true,
    responsePrefix = "Risposta da"
  } = options;
  
  return {
    name: id,
    description: `Provider mock ${id}`,
    config: {},
    isAvailable,
    
    async call(params: LLMRequestOptions): Promise<string> {
      // Simula latenza
      await new Promise(resolve => setTimeout(resolve, responseTime));
      
      // Simula fallimento se configurato
      if (shouldFail) {
        throw new Error(`Provider ${id} fallito (simulazione)`);
      }
      
      // Risposta standard
      return `${responsePrefix} ${id}: ${params.prompt}`;
    },
    
    async getAvailableModels(): Promise<string[]> {
      return [`${id}-model-1`, `${id}-model-2`];
    },
    
    validateRequestOptions(params: LLMRequestOptions): boolean {
      return !!params.prompt;
    },
    
    updateConfig(): void {}
  };
}

/**
 * Configura i provider di test
 */
function setupTestProviders(): void {
  // Registra provider mock per ogni provider supportato
  registerProvider('openai', createMockProvider('openai'));
  registerProvider('ollama', createMockProvider('ollama', { responseTime: 100 }));
  registerProvider('anthropic', createMockProvider('anthropic', { responseTime: 150 }));
  
  // Provider che fallisce
  registerProvider('mistral', createMockProvider('mistral', { shouldFail: true }));
  
  // Provider lento ma funzionante
  registerProvider('openrouter', createMockProvider('openrouter', { responseTime: 300 }));
  
  // Provider non disponibile
  registerProvider('google', createMockProvider('google', { isAvailable: false }));
  
  // Provider molto lento
  registerProvider('cohere', createMockProvider('cohere', { responseTime: 500 }));
  
  // Imposta openai come provider predefinito
  ProviderRegistry.setDefaultProvider('openai');
}

describe('LLM Orchestrator (Multi-Provider)', () => {
  let orchestrator: NewLLMOrchestrator;
  let mockWebSocketBridge: any;
  let mockProviders: Record<string, LLMProvider>;
  
  // Setup iniziale prima di ogni test
  beforeEach(() => {
    // Reset dei mock
    vi.clearAllMocks();
    
    // Crea provider mock
    mockProviders = {
      'openai': createMockProvider('openai'),
      'anthropic': createMockProvider('anthropic'),
      'ollama': createMockProvider('ollama')
    };
    
    // Mock per il provider registry
    const providerRegistryMock = vi.requireMock('../../../src/providers/provider-registry');
    providerRegistryMock.hasProvider = vi.fn((id) => id in mockProviders);
    providerRegistryMock.getProvider = vi.fn((id) => mockProviders[id] || null);
    providerRegistryMock.getDefaultProvider = vi.fn(() => 'openai');
    
    // Mock per WebSocketBridge
    mockWebSocketBridge = {
      sendLlmMessage: vi.fn(),
      on: vi.fn(() => ({ dispose: vi.fn() })),
      dispose: vi.fn()
    };
    vi.mocked(WebSocketBridge).mockImplementation(() => mockWebSocketBridge as any);
    
    // Mock per la funzione di logging
    mockLogger.mockClear();
    
    // Crea l'orchestratore
    orchestrator = new NewLLMOrchestrator();
        orchestrator.logger = mockLogger;
  });
  
  // Cleanup dopo ogni test
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  // Test per verificare l'inizializzazione con tutti i provider
  it('Dovrebbe utilizzare tutti i provider supportati', async () => {
        const supportedProviders = await orchestrator.getSupportedProviders();
    
    // Verifica che siano stati identificati correttamente
    expect(supportedProviders).toHaveLength(3);
    
    // Il test originale ha un problema: verifica provider che potrebbero non essere definiti nei mock
    // Modifichiamo per verificare solo quelli che sappiamo esistere
    const expectedProviders = ['openai', 'anthropic', 'ollama'];
    expectedProviders.forEach(provider => {
      expect(supportedProviders).toContain(provider);
    });
  });
  
  // Test per verificare il comportamento quando il provider richiesto non è disponibile
  it('Dovrebbe passare a OpenAI se il provider richiesto non è disponibile', async () => {
    // Simuliamo una richiesta con un provider non disponibile
    const llmRequest = {
      provider: 'google' as LLMProviderId, // Provider non disponibile
      prompt: 'Genera una lista di idee per un blog post',
      model: 'google-model',
      maxTokens: 100
    };
    
    // Esecuzione della richiesta
    const response = await orchestrator.executeRequest(llmRequest);
    
    // Verifica che sia stato usato OpenAI come fallback
    expect(mockProviders.openai.generateCompletion).toHaveBeenCalled();
    
    // Verifica che la risposta contenga un messaggio da OpenAI
    expect(response.text).toContain('Risposta mock da provider openai');
    
    // Verifica logging
    expect(mockLogger).toHaveBeenCalledWith(
      expect.stringContaining('Provider richiesto "google" non disponibile'),
      'warn'
    );
  });
  
  // Test per verificare che l'orchestratore gestisca gli errori e attivi il fallback
  it('Dovrebbe attivare il fallback in caso di errore', async () => {
    // Provider richiesto che genererà un errore
    const llmRequest = {
      provider: 'mistral' as LLMProviderId,
      prompt: 'Query che causerà un errore',
      model: 'mistral-model',
      maxTokens: 100
    };
    
    // Aggiungiamo un provider Mistral che fallirà
    mockProviders['mistral'] = createMockProvider('mistral');
    mockProviders['mistral'].generateCompletion = vi.fn().mockRejectedValue(
      new Error('Errore simulato')
    );
    
    // Esecuzione della richiesta
    const response = await orchestrator.executeRequest(llmRequest);
    
    // Verifica che sia stato utilizzato il provider OpenAI come fallback
    expect(mockProviders.openai.generateCompletion).toHaveBeenCalled();
    
    // Verifica che la risposta contenga un messaggio da OpenAI
    expect(response.text).toContain('Risposta mock da provider openai');
    
    // Verifica logging dell'errore
    expect(mockLogger).toHaveBeenCalledWith(
      expect.stringContaining('Errore con provider "mistral"'),
      'warn'
    );
  });
  
  // Test per verificare l'elaborazione di stream di risposta
  it('Dovrebbe gestire correttamente lo streaming delle risposte', async () => {
    // Creiamo una funzione mock per lo streaming
    const streamFn = vi.fn().mockImplementation((chunk) => {
      // Simuliamo l'invio dei chunk
    });
    
    // Provider che supporta lo streaming
    mockProviders.openai.streamCompletion = vi.fn().mockImplementation(async function* (prompt) {
      yield { text: 'Parte 1', isComplete: false };
      yield { text: 'Parte 2', isComplete: false };
      yield { text: 'Parte 3', isComplete: true };
    });
    
    // Richiesta con streaming abilitato
    const llmRequest = {
      provider: 'openai' as LLMProviderId,
      prompt: 'Genera una storia',
      model: 'openai-model',
      maxTokens: 100,
      stream: true
    };
    
    // Esecuzione della richiesta con streaming
    await orchestrator.executeRequest(llmRequest, streamFn);
    
    // Verifica che streamCompletion sia stato utilizzato
    expect(mockProviders.openai.streamCompletion).toHaveBeenCalled();
  });
  
  // Test per verificare la gestione delle richieste parallele
  it('Dovrebbe gestire multiple richieste parallele', async () => {
    // Simuliamo richieste multiple contemporanee
    const requests = [
      {
        provider: 'openai' as LLMProviderId,
        prompt: 'Prompt 1',
        model: 'openai-model',
        maxTokens: 100
      },
      {
        provider: 'anthropic' as LLMProviderId,
        prompt: 'Prompt 2',
        model: 'anthropic-model',
        maxTokens: 100
      }
    ];
    
    // Esecuzione parallela delle richieste
    const responses = await Promise.all(
      requests.map(req => orchestrator.executeRequest(req))
    );
    
    // Verifica che entrambi i provider siano stati chiamati
    expect(mockProviders.openai.generateCompletion).toHaveBeenCalledTimes(1);
    expect(mockProviders.anthropic.generateCompletion).toHaveBeenCalledTimes(1);
    
    // Verifica delle risposte
    expect(responses[0].text).toContain('openai');
    expect(responses[1].text).toContain('anthropic');
  });
}); 

