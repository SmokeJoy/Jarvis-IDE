/**
 * @file provider-registry-stub.ts
 * @description Stub per i provider LLM nei test
 */

import {
  LLMProviderHandler as ILLMProviderHandler,
  LLMResponse,
} from '@/mas/types/llm-provider.types';

export class LLMProviderHandler implements ILLMProviderHandler {
  public id: string;
  public name: string;
  public isEnabled: boolean = true;
  public isAvailable: boolean = true;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * Abilita il provider
   */
  public async enable(): Promise<void> {
    this.isEnabled = true;
  }

  /**
   * Disabilita il provider
   */
  public async disable(): Promise<void> {
    this.isEnabled = false;
  }

  /**
   * Esegue una chiamata al provider
   * @param prompt Il prompt da inviare al provider
   * @returns La risposta del provider
   */
  public async call(prompt: string): Promise<LLMResponse> {
    return {
      text: `Mock response for: ${prompt}`,
      providerId: this.id,
    };
  }

  /**
   * Ottiene i modelli disponibili per questo provider
   * @returns Array di nomi dei modelli disponibili
   */
  public async getAvailableModels(): Promise<string[]> {
    return ['mock-model'];
  }

  /**
   * Valida una richiesta prima dell'invio
   * @param prompt Il prompt da validare
   * @returns true se la richiesta è valida, false altrimenti
   */
  public validateRequest(prompt: string): boolean {
    return true;
  }
}

/**
 * Registra i provider predefiniti
 * @returns Array di provider
 */
export function registerDefaultProviders(): LLMProviderHandler[] {
  return [
    new LLMProviderHandler('openai', 'OpenAI'),
    new LLMProviderHandler('anthropic', 'Anthropic'),
    new LLMProviderHandler('mistral', 'Mistral'),
  ];
}
