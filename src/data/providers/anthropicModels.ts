/**
 * @file anthropicModels.ts
 * @description Definizioni statiche dei modelli Anthropic
 * Fornisce un elenco completo dei modelli Anthropic supportati
 */

import type { OpenAiCompatibleModelInfo } from "../../shared/types/api.types.js";

/**
 * Elenco statico dei modelli Anthropic disponibili
 * Utilizzato come fallback quando non è possibile recuperare i modelli dall'API
 */
export const ANTHROPIC_MODELS: OpenAiCompatibleModelInfo[] = [
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    contextLength: 200000,
    maxTokens: 8192,
    contextWindow: 200000,
    supportsImages: true,
    supportsComputerUse: true,
    supportsPromptCache: true,
    inputPrice: 3.0,
    outputPrice: 15.0,
    cacheWritesPrice: 3.75,
    cacheReadsPrice: 0.3,
    provider: "anthropic"
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    contextLength: 200000,
    maxTokens: 8192,
    contextWindow: 200000,
    supportsImages: true,
    supportsComputerUse: true,
    supportsPromptCache: true,
    inputPrice: 3.0,
    outputPrice: 15.0,
    cacheWritesPrice: 3.75,
    cacheReadsPrice: 0.3,
    provider: "anthropic"
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    contextLength: 200000,
    maxTokens: 8192,
    contextWindow: 200000,
    supportsImages: false,
    supportsPromptCache: true,
    inputPrice: 0.8,
    outputPrice: 4.0,
    cacheWritesPrice: 1.0,
    cacheReadsPrice: 0.08,
    provider: "anthropic"
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    contextLength: 200000,
    maxTokens: 8192,
    contextWindow: 200000,
    supportsImages: true,
    supportsComputerUse: true,
    supportsPromptCache: true,
    inputPrice: 15.0,
    outputPrice: 75.0,
    cacheWritesPrice: 18.75,
    cacheReadsPrice: 1.5,
    provider: "anthropic"
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    contextLength: 200000,
    maxTokens: 8192,
    contextWindow: 200000,
    supportsImages: true,
    supportsComputerUse: true,
    supportsPromptCache: true,
    inputPrice: 3.0,
    outputPrice: 15.0,
    cacheWritesPrice: 3.75,
    cacheReadsPrice: 0.3,
    provider: "anthropic"
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    contextLength: 200000,
    maxTokens: 8192,
    contextWindow: 200000,
    supportsImages: false,
    supportsPromptCache: true,
    inputPrice: 0.8,
    outputPrice: 4.0,
    cacheWritesPrice: 1.0,
    cacheReadsPrice: 0.08,
    provider: "anthropic"
  },
  {
    id: "claude-instant-1.2",
    name: "Claude Instant 1.2",
    contextLength: 200000,
    maxTokens: 4096,
    contextWindow: 200000,
    supportsImages: true,
    supportsPromptCache: true,
    inputPrice: 0.25,
    outputPrice: 1.25,
    cacheWritesPrice: 0.3,
    cacheReadsPrice: 0.03,
    provider: "anthropic"
  }
]; 