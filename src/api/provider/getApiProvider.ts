import { LLMProviderId } from '../../types/global.js';
import { getProvider } from '../../../mas/providers/provider-registry';
import type { ApiProvider, ProviderOptions } from './base.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import { TogetherProvider } from './together.js';
import { DeepSeekProvider } from './deepseek.js';
import { QwenProvider } from './qwen.js';
import { MistralProvider } from './mistral.js';
import { LMStudioProvider } from './lmstudio.js';
import { AnthropicProvider } from './anthropic.js';
import { VertexProvider } from './vertex.js';
import { OpenRouterProvider } from './OpenRouterProvider';
import { VsCodeLmProvider } from './vscode-lm.js';
import { BedrockProvider } from './bedrock.js';
import { GeminiProvider } from './gemini.js';
import { OpenAINativeProvider } from './openai-native.js';
import type { RequestyProvider } from './requesty.js';
import { JarvisIdeProvider } from './jarvis-ide.js';
import { LiteLlmProvider } from './litellm.js';
import { AskSageProvider } from './asksage.js';
import { XAIProvider } from './xai.js';
import { SambanovaProvider } from './sambanova.js';
import { LocalCustomProvider } from './local-custom.js';

/**
 * Mappa dei provider LLM supportati
 */
const apiProviders: Record<LLMProviderId, new (options: ProviderOptions) => ApiProvider> = {
  'openai': OpenAIProvider,
  'ollama': OllamaProvider,
  'deepseek': DeepSeekProvider,
  'together': TogetherProvider,
  'mistral': MistralProvider,
  'vertex': VertexProvider,
  'qwen': QwenProvider,
  'lmstudio': LMStudioProvider,
  'local-custom': LocalCustomProvider,
  'anthropic': AnthropicProvider,
  'openrouter': OpenRouterProvider,
  'vscode-lm': VsCodeLmProvider,
  'bedrock': BedrockProvider,
  'gemini': GeminiProvider,
  'openai-native': OpenAINativeProvider,
  'requesty': RequestyProvider,
  'jarvis-ide': JarvisIdeProvider,
  'litellm': LiteLlmProvider,
  'asksage': AskSageProvider,
  'xai': XAIProvider,
  'sambanova': SambanovaProvider
};

/**
 * Restituisce un'istanza di provider LLM in base all'ID e alle opzioni fornite
 * @param providerId ID del provider LLM
 * @param options Opzioni di configurazione
 * @returns Istanza del provider LLM
 */
export function getApiProvider(providerId: LLMProviderId, options: ProviderOptions): ApiProvider {
    // Prima verifica nel registry dinamico
  const RegisteredProvider = getProvider(providerId);
  if (RegisteredProvider) {
    return new RegisteredProvider(options);
  }

  // Fallback alla mappa statica esistente
  const ProviderClass = apiProviders[providerId];
  
  if (!ProviderClass) {
    throw new Error(`Provider LLM non supportato o non registrato: ${providerId}`);
  }
  
  return new ProviderClass(options);
}

/**
 * Verifica se un provider LLM è supportato
 * @param providerId ID del provider LLM da verificare
 * @returns true se il provider è supportato, false altrimenti
 */
export function isProviderSupported(providerId: string): providerId is LLMProviderId {
  return providerId in apiProviders;
}