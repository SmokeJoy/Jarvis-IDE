/**
 * @file api.types.ts
 * @description File di compatibilità che re-esporta i tipi API dal file src/shared/types/api.types.ts
 */

import { ConfigModelInfo } from './models.js';

// Ri-esporta tutti i tipi dal file src/shared/types/api.types.ts
export type {
  ModelInfo,
  OpenAiCompatibleModelInfo,
  AzureOpenAIDeploymentId,
  ApiTransformer,
  ApiHandlerOptions,
  ApiError,
  ApiStreamTextChunk,
  ApiStreamReasoningChunk,
  ApiStreamUsageChunk,
  ApiMessageGenerator,
  LLMProviderId,
  ApiStream,
  OpenRouterModelInfo,
  ApiConfiguration,
  LLMProvider,
  ChatCompletionContentPartText,
  ChatCompletionContentPartImage
} from '../shared/types/api.types.js';

export type LLMProvider = 'openai' | 'anthropic' | 'openrouter' | 'together' | 'ollama';

export interface OpenAiCompatibleModelInfo extends ConfigModelInfo {
  provider: LLMProvider;
  apiVersion?: string;
  supportsStreaming?: boolean;
  supportsFunctionCalling?: boolean;
}

export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  models: OpenAiCompatibleModelInfo[];
} 