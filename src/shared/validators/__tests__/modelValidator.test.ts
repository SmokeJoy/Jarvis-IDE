import {
  isModelInfoBase,
  isModelInfoStandard,
  isModelInfo,
  isOpenAiCompatibleModelInfo,
  isAnthropicModelInfo,
  isOpenRouterModelInfo,
  isAzureOpenAIModelInfo,
  isValidProviderId,
  validateModelInfoArray,
  ModelInfoBase,
  ModelInfo,
  ProviderId,
} from '../modelValidator';

// Mock del logger
jest.mock('../../logging', () => ({
  getLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('modelValidator', () => {
  describe('isValidProviderId', () => {
    it('dovrebbe identificare i provider ID validi', () => {
      expect(isValidProviderId('openai')).toBe(true);
      expect(isValidProviderId('anthropic')).toBe(true);
      expect(isValidProviderId('openrouter')).toBe(true);
      expect(isValidProviderId('azureopenai')).toBe(true);
      expect(isValidProviderId('local')).toBe(true);
    });

    it('dovrebbe rifiutare i provider ID non validi', () => {
      expect(isValidProviderId('invalid')).toBe(false);
      expect(isValidProviderId('')).toBe(false);
      expect(isValidProviderId(123 as any)).toBe(false);
      expect(isValidProviderId(null as any)).toBe(false);
      expect(isValidProviderId(undefined as any)).toBe(false);
    });
  });

  describe('isModelInfoBase', () => {
    const validModel: ModelInfoBase = {
      id: 'model-id',
      name: 'Test Model',
      provider: 'openai',
      contextLength: 8192,
    };

    it('dovrebbe validare un ModelInfoBase corretto', () => {
      expect(isModelInfoBase(validModel)).toBe(true);
    });

    it('dovrebbe rifiutare input null o undefined', () => {
      expect(isModelInfoBase(null)).toBe(false);
      expect(isModelInfoBase(undefined)).toBe(false);
    });

    it('dovrebbe rifiutare input non-oggetto', () => {
      expect(isModelInfoBase('string')).toBe(false);
      expect(isModelInfoBase(123)).toBe(false);
      expect(isModelInfoBase([])).toBe(false);
    });

    it('dovrebbe rifiutare oggetti con proprietà mancanti', () => {
      expect(isModelInfoBase({ name: 'test', provider: 'openai', contextLength: 4000 })).toBe(
        false
      );
      expect(isModelInfoBase({ id: 'test', provider: 'openai', contextLength: 4000 })).toBe(false);
      expect(isModelInfoBase({ id: 'test', name: 'test', contextLength: 4000 })).toBe(false);
      expect(isModelInfoBase({ id: 'test', name: 'test', provider: 'openai' })).toBe(false);
    });

    it('dovrebbe rifiutare oggetti con proprietà di tipo errato', () => {
      expect(isModelInfoBase({ ...validModel, id: 123 } as any)).toBe(false);
      expect(isModelInfoBase({ ...validModel, name: 123 } as any)).toBe(false);
      expect(isModelInfoBase({ ...validModel, provider: 123 } as any)).toBe(false);
      expect(isModelInfoBase({ ...validModel, contextLength: '4000' } as any)).toBe(false);
    });

    it('dovrebbe rifiutare oggetti con provider non valido', () => {
      expect(isModelInfoBase({ ...validModel, provider: 'invalid' } as any)).toBe(false);
    });

    it('dovrebbe rifiutare oggetti con valori vuoti', () => {
      expect(isModelInfoBase({ ...validModel, id: '' })).toBe(false);
      expect(isModelInfoBase({ ...validModel, name: '' })).toBe(false);
    });

    it('dovrebbe rifiutare oggetti con contextLength negativo o zero', () => {
      expect(isModelInfoBase({ ...validModel, contextLength: 0 })).toBe(false);
      expect(isModelInfoBase({ ...validModel, contextLength: -100 })).toBe(false);
    });
  });

  describe('isModelInfoStandard', () => {
    const validModel = {
      id: 'model-id',
      name: 'Test Model',
      provider: 'openai' as ProviderId,
      contextLength: 8192,
      maxTokens: 4000,
      description: 'Test description',
      supported: true,
    };

    it('dovrebbe validare un ModelInfoStandard corretto', () => {
      expect(isModelInfoStandard(validModel)).toBe(true);
    });

    it('dovrebbe validare un ModelInfoStandard con proprietà opzionali mancanti', () => {
      expect(
        isModelInfoStandard({
          id: 'model-id',
          name: 'Test Model',
          provider: 'openai',
          contextLength: 8192,
        })
      ).toBe(true);

      expect(
        isModelInfoStandard({
          ...validModel,
          maxTokens: undefined,
        })
      ).toBe(true);

      expect(
        isModelInfoStandard({
          ...validModel,
          description: undefined,
        })
      ).toBe(true);

      expect(
        isModelInfoStandard({
          ...validModel,
          supported: undefined,
        })
      ).toBe(true);
    });

    it('dovrebbe rifiutare oggetti con proprietà di tipo errato', () => {
      expect(isModelInfoStandard({ ...validModel, maxTokens: '4000' } as any)).toBe(false);
      expect(isModelInfoStandard({ ...validModel, description: 123 } as any)).toBe(false);
      expect(isModelInfoStandard({ ...validModel, supported: 'yes' } as any)).toBe(false);
    });

    it('dovrebbe rifiutare un modello base non valido', () => {
      expect(isModelInfoStandard(null)).toBe(false);
      expect(isModelInfoStandard({ id: 'test' } as any)).toBe(false);
    });
  });

  describe('isModelInfo', () => {
    const validModel: ModelInfo = {
      id: 'model-id',
      name: 'Test Model',
      provider: 'openai',
      contextLength: 8192,
      maxTokens: 4000,
      pricing: {
        prompt: 0.001,
        completion: 0.002,
        unit: 'token',
      },
      supporting: {
        images: true,
        json: true,
        functions: false,
        vision: true,
      },
    };

    it('dovrebbe validare un ModelInfo corretto', () => {
      expect(isModelInfo(validModel)).toBe(true);
    });

    it('dovrebbe validare un ModelInfo con proprietà opzionali mancanti', () => {
      expect(
        isModelInfo({
          id: 'model-id',
          name: 'Test Model',
          provider: 'openai',
          contextLength: 8192,
        })
      ).toBe(true);

      expect(
        isModelInfo({
          ...validModel,
          pricing: undefined,
        })
      ).toBe(true);

      expect(
        isModelInfo({
          ...validModel,
          supporting: undefined,
        })
      ).toBe(true);
    });

    it('dovrebbe validare un ModelInfo con pricing parziale', () => {
      expect(
        isModelInfo({
          ...validModel,
          pricing: { prompt: 0.001 },
        })
      ).toBe(true);

      expect(
        isModelInfo({
          ...validModel,
          pricing: { completion: 0.002 },
        })
      ).toBe(true);

      expect(
        isModelInfo({
          ...validModel,
          pricing: { unit: 'token' },
        })
      ).toBe(true);
    });

    it('dovrebbe validare un ModelInfo con supporting parziale', () => {
      expect(
        isModelInfo({
          ...validModel,
          supporting: { images: true },
        })
      ).toBe(true);

      expect(
        isModelInfo({
          ...validModel,
          supporting: { json: true },
        })
      ).toBe(true);
    });

    it('dovrebbe rifiutare oggetti con pricing di tipo errato', () => {
      expect(isModelInfo({ ...validModel, pricing: 'expensive' } as any)).toBe(false);
      expect(isModelInfo({ ...validModel, pricing: { prompt: '0.001' } } as any)).toBe(false);
      expect(isModelInfo({ ...validModel, pricing: { completion: '0.002' } } as any)).toBe(false);
      expect(isModelInfo({ ...validModel, pricing: { unit: 'invalid' } } as any)).toBe(false);
    });

    it('dovrebbe rifiutare oggetti con supporting di tipo errato', () => {
      expect(isModelInfo({ ...validModel, supporting: 'yes' } as any)).toBe(false);
      expect(isModelInfo({ ...validModel, supporting: { images: 'yes' } } as any)).toBe(false);
      expect(isModelInfo({ ...validModel, supporting: { json: 'no' } } as any)).toBe(false);
      expect(isModelInfo({ ...validModel, supporting: { functions: 'maybe' } } as any)).toBe(false);
      expect(isModelInfo({ ...validModel, supporting: { vision: 'yes' } } as any)).toBe(false);
    });
  });

  describe('isAnthropicModelInfo', () => {
    const validModel = {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic' as ProviderId,
      contextLength: 200000,
      version: '2023-06-01',
      supportsJsonMode: true,
    };

    it('dovrebbe validare un modello Anthropic valido', () => {
      expect(isAnthropicModelInfo(validModel)).toBe(true);
    });

    it('dovrebbe rifiutare oggetti con proprietà di tipo errato', () => {
      expect(isAnthropicModelInfo({ ...validModel, version: 3 } as any)).toBe(false);
      expect(isAnthropicModelInfo({ ...validModel, supportsJsonMode: 'yes' } as any)).toBe(false);
      expect(isAnthropicModelInfo({ ...validModel, supportsVision: 'no' } as any)).toBe(false);
    });
  });

  describe('isOpenRouterModelInfo', () => {
    const validModel = {
      id: 'anthropic/claude-3-sonnet',
      name: 'Claude 3 Sonnet (via OpenRouter)',
      provider: 'openrouter' as ProviderId,
      contextLength: 200000,
      originalProvider: 'anthropic',
      performanceScore: 9.5,
    };

    it('dovrebbe validare un modello OpenRouter valido', () => {
      expect(isOpenRouterModelInfo(validModel)).toBe(true);
    });

    it('dovrebbe rifiutare un modello con provider diverso', () => {
      const invalidModel = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        contextLength: 8000,
        originalProvider: 'openai',
      };
      expect(isOpenRouterModelInfo(invalidModel)).toBe(false);
    });
  });

  describe('isAzureOpenAIModelInfo', () => {
    it('dovrebbe validare un modello Azure OpenAI valido', () => {
      const validModel = {
        id: 'azure-gpt4',
        name: 'GPT-4 su Azure',
        provider: 'azureopenai',
        contextLength: 8000,
        deploymentId: 'gpt-4-deployment',
        apiVersion: '2023-05-15',
      };
      expect(isAzureOpenAIModelInfo(validModel)).toBe(true);
    });

    it('dovrebbe rifiutare un modello senza deploymentId', () => {
      const invalidModel = {
        id: 'azure-gpt4',
        name: 'GPT-4 su Azure',
        provider: 'azureopenai',
        contextLength: 8000,
        apiVersion: '2023-05-15',
      };
      expect(isAzureOpenAIModelInfo(invalidModel)).toBe(false);
    });
  });

  describe('isValidProviderId', () => {
    it('dovrebbe validare provider ID validi', () => {
      expect(isValidProviderId('openai')).toBe(true);
      expect(isValidProviderId('anthropic')).toBe(true);
      expect(isValidProviderId('openrouter')).toBe(true);
      expect(isValidProviderId('azureopenai')).toBe(true);
    });

    it('dovrebbe rifiutare provider ID non validi', () => {
      expect(isValidProviderId('invalid')).toBe(false);
      expect(isValidProviderId('')).toBe(false);
      expect(isValidProviderId(null)).toBe(false);
      expect(isValidProviderId(undefined)).toBe(false);
    });
  });

  describe('validateModelInfoArray', () => {
    it('dovrebbe filtrare i modelli non validi e restituire solo quelli validi', () => {
      const models = [
        {
          id: 'model-1',
          name: 'Valid Model 1',
          provider: 'openai',
          contextLength: 4000,
        },
        {
          id: 'model-2',
          name: 'Invalid Model',
          provider: 'openai',
          // contextLength mancante
        },
        {
          id: 'model-3',
          name: 'Valid Model 2',
          provider: 'anthropic',
          contextLength: 8000,
        },
      ];

      const result = validateModelInfoArray(models, 'testProvider');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('model-1');
      expect(result[1].id).toBe('model-3');
    });

    it('dovrebbe gestire array vuoti', () => {
      expect(validateModelInfoArray([], 'testProvider')).toEqual([]);
    });

    it('dovrebbe gestire input non array', () => {
      expect(validateModelInfoArray(null, 'testProvider')).toEqual([]);
      expect(validateModelInfoArray(undefined, 'testProvider')).toEqual([]);
      expect(validateModelInfoArray('not an array', 'testProvider')).toEqual([]);
    });
  });
});
