import { ModelInfo } from '../../../src/shared/types/api.types';
import { openAiModelInfoSaneDefaults } from '../../../shared/api';

export interface OpenAiConfig {
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: string;
}

export function getOpenAiConfig(modelId: string, modelInfo?: ModelInfo): OpenAiConfig {
  const isDeepseekReasoner = modelId.includes('deepseek-reasoner');
  const isO3Mini = modelId.includes('o3-mini');

  const config: OpenAiConfig = {
    temperature: modelInfo?.temperature ?? openAiModelInfoSaneDefaults.temperature,
    maxTokens:
      modelInfo?.maxTokens && modelInfo.maxTokens > 0 ? Number(modelInfo.maxTokens) : undefined,
  };

  if (isO3Mini) {
    config.temperature = undefined;
    config.reasoningEffort = 'medium';
  }

  return config;
}
