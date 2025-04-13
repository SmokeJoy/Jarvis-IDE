/**
 * @file api.types.ts
 * @description Definizioni per le API
 */

import { ConfigModelInfo } from './models';

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
  ChatCompletionContentPartImage,
} from '../shared/types/api.types';

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

export interface ApiConfiguration {
  provider: string;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers?: Record<string, string>;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}
