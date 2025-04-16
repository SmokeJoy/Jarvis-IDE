import { LLMProviderHandler, LLMResponse } from '../../src/mas/types/llm-provider.types';

export function createMockProvider(overrides: Partial<LLMProviderHandler> = {}): LLMProviderHandler {
  const handler: LLMProviderHandler = {
    id: overrides.id ?? 'mock-provider',
    name: overrides.name ?? 'Mock Provider',
    isEnabled: true,
    isAvailable: true,
    enable: async () => {},
    disable: async () => {},
    call: async (prompt: string): Promise<LLMResponse> => ({
      text: `Mock response for: ${prompt}`,
      providerId: overrides.id ?? 'mock-provider'
    }),
    getAvailableModels: async () => ['mock-model'],
    validateRequest: () => true,
    ...overrides
  };
  return handler;
} 