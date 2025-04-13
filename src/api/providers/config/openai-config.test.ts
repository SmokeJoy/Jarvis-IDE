import { getOpenAiConfig } from './openai-config';
import { openAiModelInfoSaneDefaults } from '../../../shared/api';
import { ModelInfo } from '../../../shared/types/api.types';

describe('getOpenAiConfig', () => {
  it('dovrebbe restituire i valori predefiniti quando modelInfo è undefined', () => {
    const config = getOpenAiConfig('gpt-3.5-turbo');
    expect(config.temperature).toBe(openAiModelInfoSaneDefaults.temperature);
    expect(config.maxTokens).toBeUndefined();
    expect(config.reasoningEffort).toBeUndefined();
  });

  it('dovrebbe utilizzare i valori di modelInfo quando forniti', () => {
    const modelInfo: ModelInfo = {
      temperature: 0.9,
      maxTokens: 1024,
    };
    const config = getOpenAiConfig('gpt-3.5-turbo', modelInfo);
    expect(config.temperature).toBe(0.9);
    expect(config.maxTokens).toBe(1024);
    expect(config.reasoningEffort).toBeUndefined();
  });

  it('dovrebbe applicare la configurazione speciale per o3-mini', () => {
    const config = getOpenAiConfig('o3-mini');
    expect(config.temperature).toBeUndefined();
    expect(config.reasoningEffort).toBe('medium');
  });

  it('dovrebbe gestire correttamente maxTokens quando è 0 o negativo', () => {
    const modelInfo: ModelInfo = {
      maxTokens: 0,
    };
    const config = getOpenAiConfig('gpt-3.5-turbo', modelInfo);
    expect(config.maxTokens).toBeUndefined();

    const modelInfoNegative: ModelInfo = {
      maxTokens: -1,
    };
    const configNegative = getOpenAiConfig('gpt-3.5-turbo', modelInfoNegative);
    expect(configNegative.maxTokens).toBeUndefined();
  });

  it('dovrebbe mantenere le configurazioni esistenti quando si applica o3-mini', () => {
    const modelInfo: ModelInfo = {
      maxTokens: 1024,
    };
    const config = getOpenAiConfig('o3-mini', modelInfo);
    expect(config.maxTokens).toBe(1024);
    expect(config.temperature).toBeUndefined();
    expect(config.reasoningEffort).toBe('medium');
  });
});
