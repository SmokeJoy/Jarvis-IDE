import { OpenAIProvider } from './providers/OpenAIProvider.js.js';
import { OllamaProvider } from './providers/OllamaProvider.js.js';
import { TogetherProvider } from './providers/TogetherProvider.js.js';
import type { OpenRouterProvider } from './providers/OpenRouterProvider.js.js';
import { VertexProvider } from './providers/VertexProvider.js.js';
import { AnthropicProvider } from './providers/AnthropicProvider.js.js';
import { GeminiProvider } from './providers/GeminiProvider.js.js';
import { MistralProvider } from './providers/MistralProvider.js.js';
import { LLMStudioProvider } from './providers/LLMStudioProvider.js.js';
import { ApiProvider } from './ApiProvider.js.js';
import { LLMProviderId } from '../../shared/types/api.types.js.js';

/**
 * Restituisce un'istanza del provider API appropriato in base all'ID
 * @param providerId L'identificatore del provider (openai, ollama, ecc.)
 * @returns Un'istanza di ApiProvider che corrisponde all'ID dato
 */
export function getApiProvider(providerId: LLMProviderId): ApiProvider {
  switch (providerId) {
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    case 'together':
      return new TogetherProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    case 'vertex':
      return new VertexProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'gemini':
      return new GeminiProvider();
    case 'mistral':
      return new MistralProvider();
    case 'lmstudio':
      return new LLMStudioProvider();
    default:
      throw new Error(`Provider non supportato: ${providerId}`);
  }
} 