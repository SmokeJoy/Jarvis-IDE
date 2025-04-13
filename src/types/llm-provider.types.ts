/**
 * @file llm-provider.types.ts
 * @description Centralized type definitions for LLM providers
 */

/**
 * Identificatori per i diversi provider di LLM
 */
export type LLMProviderId =
  | 'anthropic'
  | 'openai'
  | 'azureopenai'
  | 'openrouter'
  | 'vertex'
  | 'aws'
  | 'gemini'
  | 'ollama'
  | 'lmstudio'
  | 'deepseek'
  | 'qwen'
  | 'mistral'
  | 'litellm'
  | 'asksage'
  | 'sambanova'
  | 'xai'
  | 'default'
  | 'zero'
  | 'mock'
  | 'mock1'
  | 'mock2'
  | 'test';

/**
 * Informazioni sul modello LLM
 */
export interface ModelInfo {
  id: string;
  name: string;
  contextSize?: number;
  supportsStreaming?: boolean;
  supportsFunctions?: boolean;
  maxOutputTokens?: number;
  tags?: string[];
}

/**
 * Interfaccia comune per tutti i provider LLM
 */
export interface LLMProvider {
  id: LLMProviderId;
  name: string;
  supportsStreaming: boolean;
  requiresApiKey: boolean;
  modelOptions: ModelInfo[];
  defaultModel: string;
}

/**
 * Opzioni per le richieste LLM
 */
export interface LLMRequestOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopTokens?: string[];
  providerParams?: Record<string, unknown>;
}

/**
 * Risposta da un provider LLM
 */
export interface LLMResponse {
  text: string;
  model: string;
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Handler per un provider LLM
 */
export interface LLMProviderHandler {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  isAvailable: boolean;
  config?: Record<string, unknown>;

  enable(): Promise<void>;
  disable(): Promise<void>;
  updateConfig?(config: Record<string, unknown>): void;
  call(options: LLMRequestOptions): Promise<LLMResponse>;
  getAvailableModels(): Promise<ModelInfo[]>;
  validateRequest(options: LLMRequestOptions): boolean;
}
