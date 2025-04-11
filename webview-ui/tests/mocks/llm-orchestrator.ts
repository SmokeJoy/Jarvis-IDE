/**
 * @file llm-orchestrator.ts
 * @description Mock dell'orchestratore LLM per i test
 */

import { vi } from 'vitest';
import { LLMProviderId, LLMRequestOptions } from './provider-registry';

// Tipi
export interface OrchestratorOptions {
  logger?: (message: string, level?: string) => void;
  defaultProvider?: LLMProviderId;
  preferredProviders?: LLMProviderId[];
  fallbackStrategy?: 'ordered' | 'random';
  maxRetries?: number;
  timeout?: number;
}

export interface OrchestratorResult {
  content: string;
  provider: LLMProviderId;
  model?: string;
  attempts: number;
  error?: Error;
}

export interface LLMCallParams {
  prompt: string;
  systemPrompt?: string;
  providerParams?: {
    provider?: LLMProviderId;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    options?: Record<string, any>;
  };
}

// Classe mock dell'orchestratore
export class LLMOrchestrator {
  private options: OrchestratorOptions;
  private mockResult: OrchestratorResult | null = null;
  private mockError: Error | null = null;

  constructor(options: OrchestratorOptions = {}) {
    this.options = {
      defaultProvider: 'openai',
      preferredProviders: ['openai', 'anthropic', 'ollama'],
      fallbackStrategy: 'ordered',
      maxRetries: 3,
      timeout: 30000,
      ...options
    };
  }

  // Metodo per configurare il risultato mock
  setMockResult(result: OrchestratorResult) {
    this.mockResult = result;
    this.mockError = null;
  }

  // Metodo per configurare l'errore mock
  setMockError(error: Error) {
    this.mockError = error;
    this.mockResult = null;
  }

  // Metodo principale di chiamata
  async call(params: LLMCallParams): Promise<OrchestratorResult> {
    if (this.mockError) {
      throw this.mockError;
    }

    if (this.mockResult) {
      return this.mockResult;
    }

    // Comportamento predefinito se non è configurato un mock
    const provider = params.providerParams?.provider || this.options.defaultProvider || 'openai';
    return {
      content: `Risposta simulata per: ${params.prompt}`,
      provider,
      model: params.providerParams?.model || 'default-model',
      attempts: 1
    };
  }

  // Metodo per ottenere i provider supportati
  getSupportedProviders(): LLMProviderId[] {
    return this.options.preferredProviders || ['openai'];
  }

  // Metodo per chiamare un provider specifico
  async callProvider(
    providerId: LLMProviderId, 
    params: LLMRequestOptions
  ): Promise<string> {
    if (this.mockError) {
      throw this.mockError;
    }
    
    return `Risposta dal provider ${providerId} per: ${params.prompt}`;
  }
}

// Funzioni di utility
export const createOrchestrator = (options: OrchestratorOptions = {}): LLMOrchestrator => {
  return new LLMOrchestrator(options);
}; 