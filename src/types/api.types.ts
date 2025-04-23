/**
 * Tipi per l'API di Jarvis
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  temperature?: number;
  baseUrl?: string;
}

export enum LLMProviderId {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
  Local = 'local'
}

export interface APIConfiguration {
  provider: string;
  apiKey: string;
  modelId: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
} 