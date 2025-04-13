/**
 * @file provider-registry.test.ts
 * @description Test unitari per il registry dei provider LLM
 */

import {
  LLMProviderRegistry,
  registerProvider,
  hasProvider,
  getProvider,
  getDefaultProvider,
  unregisterProvider,
  LLMProviderHandler,
  LLMRequestOptions,
  LLMResponse,
  Model,
  LLMProviderId,
} from '../provider-registry';

// Mock di logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Provider di test
class MockProvider implements LLMProviderHandler {
  name = 'MockProvider';
  models: Model[] = [
    { id: 'mock-model-1', name: 'Mock Model 1', provider: 'mock' as LLMProviderId },
    { id: 'mock-model-2', name: 'Mock Model 2', provider: 'mock' as LLMProviderId },
  ];
  isAvailable = true;

  async call(options: LLMRequestOptions): Promise<LLMResponse> {
    return {
      text: `Mock response for: ${options.prompt}`,
      model: options.model || 'mock-model-1',
    };
  }

  async getAvailableModels(): Promise<Model[]> {
    return this.models;
  }

  validateRequest(options: LLMRequestOptions): boolean {
    return !!options.prompt;
  }
}

// Provider invalido per test di fallimento
const invalidProvider = {
  name: 'InvalidProvider',
  // Manca il metodo call()
  getAvailableModels: async () => [],
};

describe('Provider Registry', () => {
  // Resetta il registry prima di ogni test
  beforeEach(() => {
    LLMProviderRegistry.reset();
  });

  describe('Registrazione provider', () => {
    test('Dovrebbe registrare un provider valido', () => {
      const mockProvider = new MockProvider();
      expect(registerProvider('mock', mockProvider)).toBe(true);
      expect(hasProvider('mock')).toBe(true);
    });

    test('Dovrebbe impostare il primo provider come default', () => {
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);
      expect(LLMProviderRegistry.getDefaultProviderId()).toBe('mock');
    });

    test('Dovrebbe lanciare un errore per provider invalido', () => {
      expect(() => {
        registerProvider('invalid', invalidProvider as any);
      }).toThrow(/invalido: metodo 'call' mancante/);
    });

    test('Dovrebbe permettere di registrare più provider', () => {
      const mockProvider1 = new MockProvider();
      const mockProvider2 = new MockProvider();
      mockProvider2.name = 'MockProvider2';

      registerProvider('mock1', mockProvider1);
      registerProvider('mock2', mockProvider2);

      expect(hasProvider('mock1')).toBe(true);
      expect(hasProvider('mock2')).toBe(true);

      // Il primo dovrebbe essere quello default
      expect(LLMProviderRegistry.getDefaultProviderId()).toBe('mock1');
    });

    test('Dovrebbe impostare provider come default se richiesto', () => {
      const mockProvider1 = new MockProvider();
      const mockProvider2 = new MockProvider();
      mockProvider2.name = 'MockProvider2';

      registerProvider('mock1', mockProvider1);
      registerProvider('mock2', mockProvider2, true);

      expect(LLMProviderRegistry.getDefaultProviderId()).toBe('mock2');
    });
  });

  describe('Recupero provider', () => {
    test('Dovrebbe recuperare un provider registrato', () => {
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);

      const provider = getProvider('mock');
      expect(provider).toBe(mockProvider);
    });

    test('Dovrebbe lanciare un errore per provider non registrato', () => {
      expect(() => {
        getProvider('non-existent');
      }).toThrow(/non trovato nel registry/);
    });

    test('Dovrebbe recuperare il provider default', () => {
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);

      const provider = getDefaultProvider();
      expect(provider).toBe(mockProvider);
    });

    test("Dovrebbe lanciare un errore se non c'è provider default", () => {
      // Registra e poi rimuovi per assicurarti che non ci sia default
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);
      unregisterProvider('mock');

      expect(() => {
        getDefaultProvider();
      }).toThrow(/Nessun provider LLM predefinito configurato/);
    });
  });

  describe('Verifica provider', () => {
    test('hasProvider dovrebbe verificare se un provider esiste', () => {
      expect(hasProvider('mock')).toBe(false);

      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);

      expect(hasProvider('mock')).toBe(true);
    });
  });

  describe('Rimozione provider', () => {
    test('Dovrebbe rimuovere un provider registrato', () => {
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);

      expect(unregisterProvider('mock')).toBe(true);
      expect(hasProvider('mock')).toBe(false);
    });

    test('Dovrebbe restituire false rimuovendo un provider non registrato', () => {
      expect(unregisterProvider('non-existent')).toBe(false);
    });

    test('Dovrebbe resettare il provider default quando rimosso', () => {
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);

      expect(LLMProviderRegistry.getDefaultProviderId()).toBe('mock');

      unregisterProvider('mock');
      expect(LLMProviderRegistry.getDefaultProviderId()).toBeNull();
    });
  });

  describe('Funzionalità avanzate', () => {
    test('Dovrebbe ottenere tutti i provider registrati', () => {
      const mockProvider1 = new MockProvider();
      const mockProvider2 = new MockProvider();
      mockProvider2.name = 'MockProvider2';

      registerProvider('mock1', mockProvider1);
      registerProvider('mock2', mockProvider2);

      const allProviders = LLMProviderRegistry.getAllProviders();
      expect(allProviders.size).toBe(2);
      expect(allProviders.get('mock1')).toBe(mockProvider1);
      expect(allProviders.get('mock2')).toBe(mockProvider2);
    });

    test('Dovrebbe ottenere gli ID di tutti i provider', () => {
      const mockProvider1 = new MockProvider();
      const mockProvider2 = new MockProvider();

      registerProvider('mock1', mockProvider1);
      registerProvider('mock2', mockProvider2);

      const ids = LLMProviderRegistry.getProviderIds();
      expect(ids).toEqual(['mock1', 'mock2']);
    });

    test('Dovrebbe ottenere solo i provider disponibili', () => {
      const mockProvider1 = new MockProvider();
      const mockProvider2 = new MockProvider();
      mockProvider2.isAvailable = false;

      registerProvider('mock1', mockProvider1);
      registerProvider('mock2', mockProvider2);

      const availableProviders = LLMProviderRegistry.getAvailableProviders();
      expect(availableProviders.size).toBe(1);
      expect(availableProviders.has('mock1')).toBe(true);
      expect(availableProviders.has('mock2')).toBe(false);
    });

    test('Dovrebbe rifiutare provider senza nome', () => {
      const mockProvider = new MockProvider();
      // @ts-ignore: forza l'assegnazione di una proprietà invalida per il test
      mockProvider.name = '';

      expect(() => {
        registerProvider('mock', mockProvider);
      }).toThrow(/proprietà 'name' mancante o vuota/);
    });

    test('Dovrebbe rifiutare provider con validateRequest non funzione', () => {
      const mockProvider = new MockProvider();
      // @ts-ignore: forza l'assegnazione di una proprietà invalida per il test
      mockProvider.validateRequest = 'not a function';

      expect(() => {
        registerProvider('mock', mockProvider);
      }).toThrow(/metodo 'validateRequest' presente ma non è una funzione/);
    });
  });

  describe('Interazione con i provider', () => {
    test('Dovrebbe chiamare correttamente il metodo call del provider', async () => {
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);

      const provider = getProvider('mock');
      const response = await provider.call({ prompt: 'Hello' });
      expect(response.text).toBe('Mock response for: Hello');
    });

    test('Dovrebbe ottenere i modelli disponibili dal provider', async () => {
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);

      const provider = getProvider('mock');
      const models = await provider.getAvailableModels();

      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('mock-model-1');
      expect(models[1].id).toBe('mock-model-2');
    });

    test('Dovrebbe validare una richiesta usando il metodo validateRequest', () => {
      const mockProvider = new MockProvider();
      registerProvider('mock', mockProvider);

      const provider = getProvider('mock');

      // Il metodo validateRequest del mock controlla se prompt è truthy
      expect(provider.validateRequest?.({ prompt: 'Hello' })).toBe(true);
      expect(provider.validateRequest?.({ prompt: '' })).toBe(false);
    });
  });
});
