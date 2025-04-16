/**
 * @file provider-registry.ts
 * @description Registro dei provider LLM
 */

import { LLMProviderId } from '../../src/shared/types/global';
import { ApiProvider, ProviderOptions } from '../../../api/provider/base';
import { OpenAIProvider } from '../../../api/provider/openai';
import { OpenRouterProvider } from '../../../api/provider/openrouter';
import { OllamaProvider } from '../../../api/provider/ollama';
import { AnthropicProvider } from '../../../api/provider/anthropic';
import { MistralProvider } from '../../../api/provider/mistral';
import { GoogleProvider } from '../../../api/provider/google';
import { CohereProvider } from '../../../api/provider/cohere';
import { LLMRequest, LLMResponse, ValidationResult } from '../../types/llm-provider.types';
import { AgentContext } from '../../types/agent.types';

export interface ILLMProviderHandler {
  id: LLMProviderId;
  displayName: string;
  call(request: LLMRequest, context: AgentContext): Promise<LLMResponse>;
  getAvailableModels(): string[];
  validateRequest(request: LLMRequest): ValidationResult;
}

export class LLMProviderHandler implements ILLMProviderHandler {
  constructor(
    public readonly id: LLMProviderId,
    public readonly displayName: string
  ) {}

  async call(request: LLMRequest, context: AgentContext): Promise<LLMResponse> {
    const provider = this.getProviderInstance();
    return provider.executeRequest(request, context);
  }

  getAvailableModels(): string[] {
    return this.getProviderInstance().listModels();
  }

  validateRequest(request: LLMRequest): ValidationResult {
    return this.getProviderInstance().validateConfiguration(request);
  }
}

const providerRegistry = new Map<LLMProviderId, ILLMProviderHandler>();

/**
 * Registra i provider predefiniti
 * @returns Array di provider
 */
export function registerDefaultProviders(): ILLMProviderHandler[] {
  return [
    new LLMProviderHandler('openai', 'OpenAI'),
    new LLMProviderHandler('anthropic', 'Anthropic'),
    new LLMProviderHandler('mistral', 'Mistral'),
  ];
}

export function registerProvider(id: LLMProviderId, handler: ILLMProviderHandler): void {
  if (!validateProviderHandler(handler)) {
    throw new Error(`Handler non valido per il provider ${id}`);
  }
  providerRegistry.set(id, handler);
}

export function getProvider(id: LLMProviderId): ILLMProviderHandler | undefined {
  return providerRegistry.get(id);
}

export function hasProvider(id: LLMProviderId): boolean {
  return providerRegistry.has(id);
}

function validateProviderHandler(handler: any): handler is ILLMProviderHandler {
  return (
    typeof handler?.call === 'function' &&
    typeof handler?.getAvailableModels === 'function' &&
    typeof handler?.validateRequest === 'function'
  );
}

try {
  registerDefaultProviders();
} catch (err) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error(`❌ Errore nella registrazione dei provider predefiniti: ${error.message}`);
  throw error;
}
