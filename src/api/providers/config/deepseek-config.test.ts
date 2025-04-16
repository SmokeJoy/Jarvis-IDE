import { buildDeepSeekConfig } from './deepseek-config';
import { openAiModelInfoSaneDefaults } from '../../../shared/api';
import { ModelInfo } from '../../../src/shared/types/api.types';

describe('buildDeepSeekConfig', () => {
  it('dovrebbe restituire i valori predefiniti quando modelInfo è undefined', () => {
    const config = buildDeepSeekConfig('deepseek-chat');
    expect(config.temperature).toBe(openAiModelInfoSaneDefaults.temperature);
    expect(config.maxTokens).toBeUndefined();
    expect(config.streamOptions).toEqual({ include_usage: true });
  });

  it('dovrebbe utilizzare i valori di modelInfo quando forniti', () => {
    const modelInfo: ModelInfo = {
      temperature: 0.9,
      maxTokens: 1024,
    };
    const config = buildDeepSeekConfig('deepseek-chat', modelInfo);
    expect(config.temperature).toBe(0.9);
    expect(config.maxTokens).toBe(1024);
    expect(config.streamOptions).toEqual({ include_usage: true });
  });

  it('dovrebbe applicare la configurazione speciale per reasoner', () => {
    const config = buildDeepSeekConfig('deepseek-reasoner');
    expect(config.topP).toBe(0.1);
    expect(config.presencePenalty).toBe(0);
    expect(config.frequencyPenalty).toBe(0);
  });

  it('dovrebbe gestire correttamente maxTokens quando è 0 o negativo', () => {
    const modelInfo: ModelInfo = {
      maxTokens: 0,
    };
    const config = buildDeepSeekConfig('deepseek-chat', modelInfo);
    expect(config.maxTokens).toBeUndefined();

    const modelInfoNegative: ModelInfo = {
      maxTokens: -1,
    };
    const configNegative = buildDeepSeekConfig('deepseek-chat', modelInfoNegative);
    expect(configNegative.maxTokens).toBeUndefined();
  });

  it('dovrebbe mantenere le configurazioni esistenti quando si applica reasoner', () => {
    const modelInfo: ModelInfo = {
      temperature: 0.8,
      maxTokens: 1024,
    };
    const config = buildDeepSeekConfig('deepseek-reasoner', modelInfo);
    expect(config.temperature).toBe(0.8);
    expect(config.maxTokens).toBe(1024);
    expect(config.topP).toBe(0.1);
    expect(config.presencePenalty).toBe(0);
    expect(config.frequencyPenalty).toBe(0);
  });

  it('dovrebbe gestire case-insensitive per reasoner', () => {
    const config = buildDeepSeekConfig('DEEPSEEK-REASONER');
    expect(config.topP).toBe(0.1);
    expect(config.presencePenalty).toBe(0);
    expect(config.frequencyPenalty).toBe(0);
  });

  it('dovrebbe ignorare maxTokens se è NaN o una stringa', () => {
    const config1 = buildDeepSeekConfig('deepseek-chat', { maxTokens: NaN } as any);
    expect(config1.maxTokens).toBeUndefined();

    const config2 = buildDeepSeekConfig('deepseek-chat', { maxTokens: '1024' } as any);
    expect(config2.maxTokens).toBeUndefined();
  });

  it('dovrebbe garantire che streamOptions.include_usage sia sempre presente', () => {
    const config = buildDeepSeekConfig('deepseek-chat');
    expect(config.streamOptions).toBeDefined();
    expect(config.streamOptions.include_usage).toBe(true);
  });

  it('dovrebbe gestire correttamente i parametri estesi', () => {
    const modelInfo = {
      topP: 0.8,
      presencePenalty: 0.5,
      frequencyPenalty: 0.3,
    } as any;
    const config = buildDeepSeekConfig('deepseek-chat', modelInfo);
    expect(config.topP).toBe(0.8);
    expect(config.presencePenalty).toBe(0.5);
    expect(config.frequencyPenalty).toBe(0.3);
  });

  it('dovrebbe ignorare parametri estesi non numerici', () => {
    const modelInfo = {
      topP: '0.8',
      presencePenalty: NaN,
      frequencyPenalty: undefined,
    } as any;
    const config = buildDeepSeekConfig('deepseek-chat', modelInfo);
    expect(config.topP).toBeUndefined();
    expect(config.presencePenalty).toBeUndefined();
    expect(config.frequencyPenalty).toBeUndefined();
  });
});
