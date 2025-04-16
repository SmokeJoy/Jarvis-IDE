import { ModelInfo } from '../../../src/shared/types/api.types';
import { openAiModelInfoSaneDefaults } from '../../../shared/api';

export interface DeepSeekConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  streamOptions: {
    include_usage: boolean;
  };
}

const reasonerDefaults = {
  topP: 0.1,
  presencePenalty: 0,
  frequencyPenalty: 0,
} as const;

type ExtendedModelInfo = ModelInfo &
  Partial<{
    topP: number;
    presencePenalty: number;
    frequencyPenalty: number;
  }>;

/**
 * Costruisce la configurazione per il modello DeepSeek
 * @param modelId - ID del modello DeepSeek
 * @param modelInfo - Informazioni opzionali sul modello con parametri estesi
 * @returns Configurazione tipizzata per l'API DeepSeek
 */
export function buildDeepSeekConfig(
  modelId: string,
  modelInfo?: ExtendedModelInfo
): DeepSeekConfig {
  const isReasoner = modelId.toLowerCase().includes('reasoner');

  const config: DeepSeekConfig = {
    temperature: modelInfo?.temperature ?? openAiModelInfoSaneDefaults.temperature,
    maxTokens:
      Number.isFinite(modelInfo?.maxTokens) && modelInfo!.maxTokens! > 0
        ? Number(modelInfo!.maxTokens)
        : undefined,
    streamOptions: {
      include_usage: true,
    },
  };

  if (isReasoner) {
    Object.assign(config, reasonerDefaults);
  }

  // Aggiungi parametri estesi se forniti
  if (Number.isFinite(modelInfo?.topP)) {
    config.topP = Number(modelInfo!.topP);
  }
  if (Number.isFinite(modelInfo?.presencePenalty)) {
    config.presencePenalty = Number(modelInfo!.presencePenalty);
  }
  if (Number.isFinite(modelInfo?.frequencyPenalty)) {
    config.frequencyPenalty = Number(modelInfo!.frequencyPenalty);
  }

  return config;
}
