export type LLMProviderId =
  | 'openai'
  | 'openrouter'
  | 'ollama'
  | 'anthropic'
  | 'mistral'
  | 'google'
  | 'cohere'
  | 'mock'
  | 'mock1'
  | 'mock2'
  | 'invalid'
  | 'non-existent';

export interface Model {
  id: string;
  name: string;
  provider: LLMProviderId;
  contextSize?: number;
  supportsStreaming?: boolean;
  supportsFunctions?: boolean;
  maxOutputTokens?: number;
  tags?: string[];
}

export interface LLMRequestOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopTokens?: string[];
  providerParams?: Record<string, any>;
}

export interface LLMResponse {
  text: string;
  model: string;
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  metadata?: Record<string, any>;
}

export interface LLMProviderHandler {
  name: string;
  description?: string;
  isAvailable: boolean;
  config?: Record<string, any>;

  updateConfig?(config: Record<string, any>): void;
  call(options: LLMRequestOptions): Promise<LLMResponse>;
  getAvailableModels(): Promise<Model[]>;
  validateRequest(options: LLMRequestOptions): boolean;
}

export type LLMProviderClass = new () => LLMProviderHandler;
