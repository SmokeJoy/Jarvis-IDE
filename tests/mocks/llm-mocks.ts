import { LLMProviderHandler } from '../../src/types/llm-provider.types';

export function createMockProvider(id: string, willSucceed: boolean = true): LLMProviderHandler {
  return {
    id,
    name: `Provider ${id}`,
    isEnabled: true,
    handle: vi.fn().mockImplementation(() => {
      if (willSucceed) {
        return Promise.resolve({ result: `Risposta da ${id}` });
      } else {
        return Promise.reject(new Error(`Errore simulato per ${id}`));
      }
    })
  } as LLMProviderHandler;
}

export function createMockProviders(count: number = 3): LLMProviderHandler[] {
  const providers = ['openai', 'anthropic', 'mistral'];
  return providers.slice(0, count).map(id => createMockProvider(id));
} 