import { LLMProviderId } from '../../types/global.js.js';
import type { ApiProvider, ProviderOptions } from './base.js.js';
import { OpenAIProvider } from './openai.js.js';
import { OllamaProvider } from './ollama.js.js';
import { TogetherProvider } from './together.js.js';
import { DeepSeekProvider } from './deepseek.js.js';
import { QwenProvider } from './qwen.js.js';
import { MistralProvider } from './mistral.js.js';
import { LMStudioProvider } from './lmstudio.js.js';
import type { OpenRouterProvider } from './openrouter.js.js';
import { VertexProvider } from './vertex.js.js';
import { AnthropicProvider } from './anthropic.js.js';
import { VsCodeLmProvider } from './vscode-lm.js.js';
import { BedrockProvider } from './bedrock.js.js';
import { GeminiProvider } from './gemini.js.js';
import { OpenAINativeProvider } from './openai-native.js.js';
import type { RequestyProvider } from './requesty.js.js';
import { JarvisIdeProvider } from './jarvis-ide.js.js';
import { LiteLlmProvider } from './litellm.js.js';
import { AskSageProvider } from './asksage.js.js';
import { XAIProvider } from './xai.js.js';
import { SambanovaProvider } from './sambanova.js.js';
import { LocalCustomProvider } from './local-custom.js.js';

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
  'openrouter': OpenRouterProvider,
  'anthropic': AnthropicProvider,
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
  const ProviderClass = apiProviders[providerId];
  
  if (!ProviderClass) {
    throw new Error(`Provider LLM non supportato: ${providerId}`);
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