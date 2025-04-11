/**
 * @file provider-registry.ts
 * @description Registro dei provider LLM
 */

import { LLMProviderId } from '../../types/global.js';
import { ApiProvider, ProviderOptions } from '../../../api/provider/base.js';
import { OpenAIProvider } from '../../../api/provider/openai.js';
import { OpenRouterProvider } from '../../../api/provider/openrouter.js';
import { OllamaProvider } from '../../../api/provider/ollama.js';
import { AnthropicProvider } from '../../../api/provider/anthropic.js';
import { MistralProvider } from '../../../api/provider/mistral.js';
import { GoogleProvider } from '../../../api/provider/google.js';
import { CohereProvider } from '../../../api/provider/cohere.js';

export interface LLMProviderHandler {
  call(params: {
    input: string;
    context?: string;
    model?: string;
    options?: ProviderOptions;
  }): Promise<{ output: string }>;

  getAvailableModels(): Promise<Array<{ id: string; name: string }>>;

  validateRequest?(msg: unknown): boolean;

  new (options: ProviderOptions): ApiProvider;
}

const providerRegistry = new Map<LLMProviderId, LLMProviderHandler>();

/**
 * Registra i provider predefiniti
 * @returns Array di provider
 */
export function registerDefaultProviders(): LLMProviderHandler[] {
  return [
    new LLMProviderHandler('openai', 'OpenAI'),
    new LLMProviderHandler('anthropic', 'Anthropic'),
    new LLMProviderHandler('mistral', 'Mistral')
  ];
}

export function registerProvider(id: LLMProviderId, handler: LLMProviderHandler): void {
  if (!validateProviderHandler(handler)) {
    throw new Error(`Handler non valido per il provider ${id}`);
  }
  providerRegistry.set(id, handler);
}

export function getProvider(id: LLMProviderId): LLMProviderHandler | undefined {
  return providerRegistry.get(id);
}

export function hasProvider(id: LLMProviderId): boolean {
  return providerRegistry.has(id);
}

function validateProviderHandler(handler: any): handler is LLMProviderHandler {
  return (
    typeof handler?.prototype?.call === 'function' &&
    typeof handler?.getAvailableModels === 'function' &&
    typeof handler === 'function'
  );
}

registerDefaultProviders();