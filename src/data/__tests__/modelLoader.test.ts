/**
 * @file modelLoader.test.ts
 * @description Test per il sistema centralizzato di caricamento modelli
 */

import { fetchModels, getDefaultModel, loadModels } from '../modelLoader';
import * as providerRegistry from '../providerRegistry';
import { Logger } from '../../shared/logger';
import { OpenAiCompatibleModelInfo, LLMProviderId } from '../../shared/types/api.types';

// Mock del modulo providerRegistry
jest.mock('../providerRegistry', () => ({
  fetchModels: jest.fn(),
}));

// Mock del modulo logger
jest.mock('../../shared/logger', () => ({
  Logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('modelLoader', () => {
  // Dati di test
  const mockAnthropicModels: OpenAiCompatibleModelInfo[] = [
    {
      id: 'claude-3-7-sonnet-20250219',
      name: 'Claude 3.7 Sonnet',
      provider: 'anthropic',
      contextLength: 200000,
      maxTokens: 8192,
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      contextLength: 200000,
      maxTokens: 8192,
    },
  ];

  const mockOpenRouterModels: OpenAiCompatibleModelInfo[] = [
    {
      id: 'openai/gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openrouter',
      contextLength: 128000,
      maxTokens: 4096,
    },
  ];

  // Reset delle mock prima di ogni test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchModels', () => {
    it('dovrebbe recuperare correttamente i modelli dal registry', async () => {
      // Configura la mock per restituire i dati di test
      (providerRegistry.fetchModels as jest.Mock).mockResolvedValue(mockAnthropicModels);

      // Esegui la funzione da testare
      const models = await fetchModels('anthropic');

      // Verifica che la funzione del registry sia stata chiamata con i parametri corretti
      expect(providerRegistry.fetchModels).toHaveBeenCalledWith('anthropic', undefined, false);

      // Verifica che i modelli restituiti siano quelli attesi
      expect(models).toEqual(mockAnthropicModels);
      expect(models.length).toBe(2);
    });

    it('dovrebbe passare correttamente apiKey e forceRefresh al registry', async () => {
      // Configura la mock
      (providerRegistry.fetchModels as jest.Mock).mockResolvedValue(mockOpenRouterModels);

      // Esegui la funzione con parametri specifici
      await fetchModels('openrouter', 'test-api-key', true);

      // Verifica che i parametri siano stati passati correttamente
      expect(providerRegistry.fetchModels).toHaveBeenCalledWith('openrouter', 'test-api-key', true);
    });

    it('dovrebbe gestire correttamente gli errori e restituire un array vuoto', async () => {
      // Configura la mock per lanciare un errore
      (providerRegistry.fetchModels as jest.Mock).mockRejectedValue(new Error('Errore test'));

      // Esegui la funzione
      const models = await fetchModels('anthropic');

      // Verifica che sia stato restituito un array vuoto
      expect(models).toEqual([]);

      // Verifica che l'errore sia stato registrato nel logger
      expect(Logger.error).toHaveBeenCalled();
    });

    it('dovrebbe validare i modelli restituiti e segnalare quelli non validi', async () => {
      // Modelli con dati non validi
      const invalidModels = [
        { id: 'valid-model', name: 'Valid Model', provider: 'anthropic', contextLength: 100000 },
        { id: 'missing-name', provider: 'anthropic', contextLength: 100000 }, // Manca il nome
        { id: 'missing-provider', name: 'Missing Provider', contextLength: 100000 }, // Manca il provider
        {
          id: 'invalid-context',
          name: 'Invalid Context',
          provider: 'anthropic',
          contextLength: '100000' as any,
        }, // Tipo non valido
      ];

      // Configura la mock
      (providerRegistry.fetchModels as jest.Mock).mockResolvedValue(invalidModels);

      // Esegui la funzione
      const models = await fetchModels('anthropic');

      // Verifica che il warning sia stato registrato per i modelli non validi
      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('antropic ha restituito 3 modelli con struttura non valida')
      );

      // I modelli vengono comunque restituiti (responsabilità del chiamante filtrare)
      expect(models.length).toBe(4);
    });
  });

  describe('getDefaultModel', () => {
    it('dovrebbe recuperare il modello predefinito', async () => {
      // Configura la mock
      (providerRegistry.fetchModels as jest.Mock).mockResolvedValue(mockAnthropicModels);

      // Esegui la funzione
      const defaultModel = await getDefaultModel('anthropic');

      // Verifica che sia stato restituito il primo modello
      expect(defaultModel).toEqual(mockAnthropicModels[0]);
    });

    it('dovrebbe restituire undefined se non ci sono modelli disponibili', async () => {
      // Configura la mock per restituire un array vuoto
      (providerRegistry.fetchModels as jest.Mock).mockResolvedValue([]);

      // Esegui la funzione
      const defaultModel = await getDefaultModel('anthropic');

      // Verifica che sia stato restituito undefined
      expect(defaultModel).toBeUndefined();
    });

    it('dovrebbe gestire gli errori e restituire undefined', async () => {
      // Configura la mock per lanciare un errore
      (providerRegistry.fetchModels as jest.Mock).mockRejectedValue(new Error('Errore test'));

      // Esegui la funzione
      const defaultModel = await getDefaultModel('anthropic');

      // Verifica che sia stato restituito undefined
      expect(defaultModel).toBeUndefined();

      // Verifica che l'errore sia stato registrato nel logger
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('loadModels (funzione legacy)', () => {
    it('dovrebbe chiamare fetchModels con il provider openrouter', async () => {
      // Configura la mock
      (providerRegistry.fetchModels as jest.Mock).mockResolvedValue(mockOpenRouterModels);

      // Esegui la funzione legacy
      const models = await loadModels('test-api-key', true);

      // Verifica che fetchModels sia stato chiamato con i parametri corretti
      expect(providerRegistry.fetchModels).toHaveBeenCalledWith('openrouter', 'test-api-key', true);

      // Verifica che i modelli restituiti siano quelli attesi
      expect(models).toEqual(mockOpenRouterModels);

      // Verifica che sia stato registrato un messaggio di deprecation
      expect(Logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Chiamata loadModels deprecata')
      );
    });
  });
});
