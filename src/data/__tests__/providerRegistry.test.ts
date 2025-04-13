/**
 * @file providerRegistry.test.ts
 * @description Test per il Registry Dinamico dei Provider
 */

import { fetchModels, registerProvider, isProviderRegistered } from '../providerRegistry';
import { getCachedModels, cacheModels, clearAllCachedModels } from '../modelCache';
import { LLMProviderId, OpenAiCompatibleModelInfo } from '../../shared/types/api.types';
import { ANTHROPIC_MODELS } from '../providers/anthropicModels';

// Mock di fetch per simulare chiamate API
global.fetch = jest.fn();

// Mock dei moduli esterni
jest.mock('../modelCache', () => ({
  getCachedModels: jest.fn(),
  cacheModels: jest.fn(),
  clearAllCachedModels: jest.fn(),
}));

// Mock del logger
jest.mock('../../shared/logger', () => ({
  Logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock del provider Anthropic
jest.mock('../providers/anthropicProvider', () => ({
  fetchModelsFromAnthropic: jest.fn().mockResolvedValue(ANTHROPIC_MODELS),
  getFallbackModels: jest.fn().mockReturnValue(ANTHROPIC_MODELS),
}));

describe('providerRegistry', () => {
  beforeEach(() => {
    // Reset dei mock prima di ogni test
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (getCachedModels as jest.Mock).mockClear();
    (cacheModels as jest.Mock).mockClear();
    (clearAllCachedModels as jest.Mock).mockClear();
  });

  it('dovrebbe recuperare correttamente i modelli da OpenRouter', async () => {
    // Mock della risposta API di successo
    const mockModels = [
      {
        id: 'test-model-1',
        name: 'Test Model 1',
        context_length: 4096,
        description: 'Test model description',
        pricing: { prompt: '0.001', completion: '0.002' },
      },
    ];

    // Configura il mock di fetch per restituire una risposta di successo
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockModels }),
    });

    // Esegui la funzione da testare
    const result = await fetchModels('openrouter');

    // Verifica che fetch sia stato chiamato correttamente
    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );

    // Verifica che i modelli siano stati convertiti correttamente
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'test-model-1',
        name: 'Test Model 1',
        contextLength: 4096,
        provider: 'openrouter',
      })
    );

    // Verifica che i modelli siano stati salvati in cache
    expect(cacheModels).toHaveBeenCalledWith('openrouter', expect.any(Array));
  });

  it('dovrebbe utilizzare i modelli dalla cache in caso di errore di rete', async () => {
    // Mock dei modelli in cache
    const cachedModels = [
      {
        id: 'cached-model',
        name: 'Cached Model',
        contextLength: 8192,
        provider: 'openrouter',
      },
    ];

    // Configura il mock di getCachedModels per restituire i modelli in cache
    (getCachedModels as jest.Mock).mockReturnValueOnce(cachedModels);

    // Configura il mock di fetch per simulare un errore di rete
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Esegui la funzione da testare
    const result = await fetchModels('openrouter');

    // Verifica che fetch sia stato chiamato
    expect(global.fetch).toHaveBeenCalled();

    // Verifica che i modelli dalla cache siano stati restituiti
    expect(result).toEqual(cachedModels);
  });

  it('dovrebbe utilizzare i modelli statici di fallback se non ci sono modelli in cache', async () => {
    // Configura il mock di getCachedModels per restituire undefined (nessun modello in cache)
    (getCachedModels as jest.Mock).mockReturnValueOnce(undefined);

    // Configura il mock di fetch per simulare un errore di rete
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Esegui la funzione da testare
    const result = await fetchModels('openrouter');

    // Verifica che fetch sia stato chiamato
    expect(global.fetch).toHaveBeenCalled();

    // Verifica che i modelli statici di fallback siano stati restituiti
    expect(result).toHaveLength(expect.any(Number)); // Almeno un modello statico
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('contextLength');
  });

  it('dovrebbe recuperare correttamente i modelli Anthropic', async () => {
    // Test per il provider Anthropic
    const result = await fetchModels('anthropic');

    // Verifica che i modelli siano stati restituiti
    expect(result).toEqual(ANTHROPIC_MODELS);

    // Verifica che i modelli siano stati salvati in cache
    expect(cacheModels).toHaveBeenCalledWith('anthropic', ANTHROPIC_MODELS);
  });

  it('dovrebbe usare il fallback per Anthropic in caso di errore', async () => {
    // Configura il mock per lanciare un errore
    const error = new Error('API non disponibile');
    (
      jest.requireMock('../providers/anthropicProvider').fetchModelsFromAnthropic as jest.Mock
    ).mockRejectedValueOnce(error);

    // Esegui la funzione da testare
    const result = await fetchModels('anthropic');

    // Verifica che siano stati restituiti i modelli di fallback
    expect(result).toEqual(ANTHROPIC_MODELS);
  });

  it('dovrebbe registrare e utilizzare un nuovo provider personalizzato', async () => {
    // Crea un mock provider
    const mockProvider: LLMProviderId = 'xai';
    const mockModels: OpenAiCompatibleModelInfo[] = [
      {
        id: 'xai-model',
        name: 'XAI Model',
        contextLength: 16384,
        provider: 'xai',
      },
    ];

    // Registra il mock provider
    registerProvider(mockProvider, {
      loader: async () => mockModels,
      fallback: () => [],
    });

    // Verifica che il provider sia registrato
    expect(isProviderRegistered(mockProvider)).toBe(true);

    // Esegui la funzione da testare
    const result = await fetchModels(mockProvider);

    // Verifica che i modelli del nuovo provider siano stati restituiti
    expect(result).toEqual(mockModels);

    // Verifica che i modelli siano stati salvati in cache
    expect(cacheModels).toHaveBeenCalledWith(mockProvider, mockModels);
  });
});
