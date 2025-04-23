/**
 * Supported LLM providers
 */
export type LLMProvider = 
  | 'openai'
  | 'anthropic'
  | 'ollama'
  | 'local'
  | 'azure'
  | 'google'
  | 'mistral'
  | 'custom';

/**
 * LLM response format
 */
export interface LLMResponse {
  text: string;
  tokens: {
    input: number;
    output: number;
  };
  model: string;
  provider: LLMProvider;
  latency: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * LLM request options
 */
export interface LLMRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  timeout?: number;
}

/**
 * LLM model capabilities
 */
export interface LLMCapabilities {
  maxTokens: number;
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  embeddings: boolean;
  codeCompletion: boolean;
  chatCompletion: boolean;
}

/**
 * LLM model information
 */
export interface LLMModelInfo {
  id: string;
  name: string;
  provider: LLMProvider;
  capabilities: LLMCapabilities;
  contextWindow: number;
  pricing?: {
    input: number;
    output: number;
    currency: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * LLM function definition
 */
export interface LLMFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  required?: string[];
}

/**
 * LLM function call result
 */
export interface LLMFunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * LLM chat message
 */
export interface LLMChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: LLMFunctionCall;
} 