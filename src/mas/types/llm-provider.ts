export type LLMProviderId = string;

export interface LLMResponse {
  text: string;
  providerId: LLMProviderId;
  model?: string;
}

export interface LLMProviderHandler {
  id: LLMProviderId;
  name: string;
  isEnabled: boolean;
  isAvailable: boolean;
  enable(): Promise<void>;
  disable(): Promise<void>;
  call(prompt: string): Promise<LLMResponse>;
  getAvailableModels(): Promise<string[]>;
  validateRequest(prompt: string): boolean;
}
