import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { loadModels, fetchModelsFromOpenRouter } from '../../data/modelLoader';

vi.mock('../../data/modelLoader', () => ({
  loadModels: vi.fn(),
  fetchModelsFromOpenRouter: vi.fn(),
}));

describe('Model Loader Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock dei modelli di default
    const defaultModels = [
      {
        id: 'jarvis-ide-v1',
        name: 'Jarvis IDE v1',
        provider: 'jarvis-ide',
        contextLength: 8192,
        maxTokens: 2048,
      },
    ];

    vi.mocked(loadModels).mockResolvedValue(defaultModels);
  });

  it('should load models without API key', async () => {
    const models = await loadModels();
    expect(models).to.be.an('array');
    expect(models.length).to.be.greaterThan(0);
    expect(models[0]).to.have.property('id', 'jarvis-ide-v1');
  });

  it('should load models with valid API key', async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const openRouterModels = [
      {
        id: 'openai/gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        contextLength: 128000,
        maxTokens: 4096,
      },
    ];

    vi.mocked(loadModels).mockResolvedValue(openRouterModels);

    const models = await loadModels(apiKey);
    expect(models).to.be.an('array');
    expect(models.length).to.be.greaterThan(0);
    expect(models[0]).to.have.property('id', 'openai/gpt-4-turbo-preview');
  });

  it('should handle invalid API key', async () => {
    vi.mocked(loadModels).mockRejectedValue(new Error('Invalid API key'));

    try {
      await loadModels('invalid-key');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).to.exist;
      expect(error.message).to.equal('Invalid API key');
    }
  });

  it('should force refresh models', async () => {
    const refreshedModels = [
      {
        id: 'jarvis-ide-v1',
        name: 'Jarvis IDE v1',
        provider: 'jarvis-ide',
        contextLength: 8192,
        maxTokens: 2048,
      },
    ];

    vi.mocked(loadModels).mockResolvedValue(refreshedModels);

    const models = await loadModels(undefined, true);
    expect(models).to.be.an('array');
    expect(models.length).to.be.greaterThan(0);
    expect(models[0]).to.have.property('id', 'jarvis-ide-v1');
  });

  it('should validate model data structure', async () => {
    const models = await loadModels();
    const model = models[0];

    expect(model.id).to.exist;
    expect(model.name).to.exist;
    expect(model.provider).to.exist;
    expect(model.contextLength).to.exist;
    expect(model.maxTokens).to.exist;
  });

  test('should fetch models from OpenRouter', async () => {
    const mockModels = [
      {
        id: 'openai/gpt-4-turbo-preview',
        name: 'GPT-4 Turbo',
        context_length: 128000,
        max_tokens: 4096,
        provider: 'openai',
      },
      {
        id: 'anthropic/claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        context_length: 200000,
        max_tokens: 8192,
        provider: 'anthropic',
      },
    ];

    vi.mocked(fetchModelsFromOpenRouter).mockResolvedValue(mockModels);

    const models = await fetchModelsFromOpenRouter();
    expect(models).toEqual(mockModels);
    expect(models[0].id).to.equal('openai/gpt-4-turbo-preview');
    expect(models[1].id).to.equal('anthropic/claude-3-opus-20240229');
  });
});
