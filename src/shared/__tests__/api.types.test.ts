/**
 * @file api.types.test.ts
 * @description Test per i tipi definiti in api.types.ts
 */
import {
  ModelInfoBase,
  ModelInfoStandard,
  ModelCapabilitiesInfo,
  ModelPricingInfo,
  ModelInfo,
  OpenAiCompatibleModelInfo,
  AnthropicModelInfo,
  OpenRouterModelInfo,
  AzureOpenAIModelInfo,
  LLMProviderId,
} from '../../src/shared/types/api.types';

describe('ModelInfoBase', () => {
  it('Should accept a valid ModelInfoBase', () => {
    const modelBase: ModelInfoBase = {
      id: 'model-id',
      name: 'Model Name',
      provider: 'anthropic',
      contextLength: 100000,
    };

    // Assertions
    expect(modelBase.id).toBe('model-id');
    expect(modelBase.name).toBe('Model Name');
    expect(modelBase.provider).toBe('anthropic');
    expect(modelBase.contextLength).toBe(100000);
  });
});

describe('ModelInfoStandard', () => {
  it('Should accept a ModelInfoStandard with optional properties', () => {
    const model: ModelInfoStandard = {
      id: 'model-id',
      name: 'Model Name',
      provider: 'anthropic',
      contextLength: 100000,
      maxTokens: 4096,
      contextWindow: 100000,
      capabilities: ['text', 'images'],
      isThirdParty: false,
      description: 'A test model',
      temperature: 0.7,
    };

    // Assertions
    expect(model.id).toBe('model-id');
    expect(model.capabilities).toContain('text');
    expect(model.capabilities).toContain('images');
    expect(model.temperature).toBe(0.7);
  });
});

describe('ModelInfo', () => {
  it('Should accept a complete ModelInfo with all properties', () => {
    const model: ModelInfo = {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      contextLength: 200000,
      maxTokens: 8192,
      contextWindow: 200000,
      capabilities: ['text', 'images', 'tools'],
      isThirdParty: false,
      description: 'Claude 3 Opus by Anthropic',
      supportsImages: true,
      supportsComputerUse: true,
      supportsPromptCache: true,
      supportsTools: true,
      supportsVision: true,
      inputPrice: 15.0,
      outputPrice: 75.0,
      cacheWritesPrice: 18.75,
      cacheReadsPrice: 1.5,
      temperature: 0.7,
    };

    // Assertions
    expect(model.id).toBe('claude-3-opus');
    expect(model.provider).toBe('anthropic');
    expect(model.supportsImages).toBe(true);
    expect(model.supportsTools).toBe(true);
    expect(model.inputPrice).toBe(15.0);
    expect(model.outputPrice).toBe(75.0);
  });
});

describe('ProviderSpecificModelInfo', () => {
  it('Should accept a valid AnthropicModelInfo', () => {
    const model: AnthropicModelInfo = {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      contextLength: 200000,
      maxTokens: 8192,
      supportsImages: true,
      supportsComputerUse: true,
      inputPrice: 15.0,
      outputPrice: 75.0,
      version: '3.0',
      supportsJsonMode: true,
    };

    // Assertions
    expect(model.id).toBe('claude-3-opus');
    expect(model.provider).toBe('anthropic');
    expect(model.version).toBe('3.0');
    expect(model.supportsJsonMode).toBe(true);
  });

  it('Should accept a valid OpenRouterModelInfo', () => {
    const model: OpenRouterModelInfo = {
      id: 'anthropic/claude-3-opus',
      name: 'Claude 3 Opus (via OpenRouter)',
      provider: 'openrouter',
      contextLength: 200000,
      maxTokens: 8192,
      created: 1706151801,
      performanceScore: 9.8,
      originalProvider: 'anthropic',
      inputPrice: 15.0,
      outputPrice: 75.0,
    };

    // Assertions
    expect(model.id).toBe('anthropic/claude-3-opus');
    expect(model.provider).toBe('openrouter');
    expect(model.originalProvider).toBe('anthropic');
    expect(model.created).toBe(1706151801);
    expect(model.performanceScore).toBe(9.8);
  });

  it('Should accept a valid AzureOpenAIModelInfo', () => {
    const model: AzureOpenAIModelInfo = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'azureopenai',
      contextLength: 128000,
      maxTokens: 4096,
      deploymentId: 'gpt4-deployment',
      apiVersion: '2023-05-15',
      supportsVision: true,
    };

    // Assertions
    expect(model.id).toBe('gpt-4');
    expect(model.provider).toBe('azureopenai');
    expect(model.deploymentId).toBe('gpt4-deployment');
    expect(model.apiVersion).toBe('2023-05-15');
    expect(model.supportsVision).toBe(true);
  });
});

describe('Type compatibility', () => {
  it('Should allow using ModelInfo where ModelInfoBase is expected', () => {
    // Function that expects ModelInfoBase
    const useModelBase = (model: ModelInfoBase) => {
      return model.id;
    };

    // Create a ModelInfo
    const model: ModelInfo = {
      id: 'test-model',
      name: 'Test Model',
      provider: 'anthropic',
      contextLength: 100000,
      supportsImages: true,
      inputPrice: 10.0,
    };

    // Pass ModelInfo where ModelInfoBase is expected
    const result = useModelBase(model);
    expect(result).toBe('test-model');
  });

  it('Should allow using provider-specific models where ModelInfo is expected', () => {
    // Function that expects ModelInfo
    const useModelInfo = (model: ModelInfo) => {
      return model.contextLength;
    };

    // Create a provider-specific model
    const model: AnthropicModelInfo = {
      id: 'claude-3',
      name: 'Claude 3',
      provider: 'anthropic',
      contextLength: 100000,
      version: '3.0',
      supportsJsonMode: true,
    };

    // Pass AnthropicModelInfo where ModelInfo is expected
    const result = useModelInfo(model);
    expect(result).toBe(100000);
  });
});

describe('LLMProviderId', () => {
  it('Should accept valid provider IDs', () => {
    const providers: LLMProviderId[] = [
      'anthropic',
      'openai',
      'azureopenai',
      'openrouter',
      'aws',
      'gemini',
      'ollama',
      'mistral',
      'default',
    ];

    // Assertions
    expect(providers).toContain('anthropic');
    expect(providers).toContain('openai');
    expect(providers).toContain('azureopenai');
    expect(providers).toContain('openrouter');
  });
});
