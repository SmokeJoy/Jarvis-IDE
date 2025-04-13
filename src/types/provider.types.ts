/**
 * @file provider.types.ts
 * @description Definizioni per provider LLM
 */

export type LLMProviderId = 'openai' | 'anthropic' | 'azureopenai' | 'mock' | string;

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  contextLength?: number;
  maxTokens?: number;
  supportsImages?: boolean;
  supportsPromptCache?: boolean;
  inputPrice?: number;
  outputPrice?: number;
  contextSize?: number;
  supportsStreaming?: boolean;
  supportsFunctions?: boolean;
  pricing?: {
    input?: number;
    output?: number;
  };
}

export interface LLMResponse {
  text: string;
  providerId: LLMProviderId;
  model?: string;
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  metadata?: Record<string, any>;
}

export interface LLMProviderHandler {
  id: LLMProviderId;
  name: string;
  isEnabled: boolean;
  isAvailable: boolean;
  invoke: (...args: any[]) => Promise<any>;
  supportsStreaming?: boolean;
  enable(): Promise<void>;
  disable(): Promise<void>;
  updateConfig?(config: Record<string, any>): void;
  call(options: LLMRequestOptions): Promise<LLMResponse>;
  getAvailableModels(): Promise<ModelInfo[]>;
  validateRequest(prompt: string): boolean;
}

export interface LLMRequestOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopTokens?: string[];
  providerParams?: Record<string, any>;
}
