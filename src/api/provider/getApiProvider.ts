import { LLMProviderId } from '../../types/global';
import { getProvider } from '../../../mas/providers/provider-registry';
import { ApiProvider, ProviderOptions } from './base';
import { OpenAIProvider } from './openai';
import { OllamaProvider } from './ollama';
import { TogetherProvider } from './together';
import { DeepSeekProvider } from './deepseek';
import { QwenProvider } from './qwen';
import { MistralProvider } from './mistral';
import { LMStudioProvider } from './lmstudio';
import { AnthropicProvider } from './anthropic';
import { VertexProvider } from './vertex';
import { OpenRouterProvider } from './OpenRouterProvider';
import { VsCodeLmProvider } from './vscode-lm';
import { BedrockProvider } from './bedrock';
import { GeminiProvider } from './gemini';
import { OpenAINativeProvider } from './openai-native';
import { RequestyProvider } from './requesty';
import { JarvisIdeProvider } from './jarvis-ide';
import { LiteLlmProvider } from './litellm';
import { AskSageProvider } from './asksage';
import { XAIProvider } from './xai';
import { SambanovaProvider } from './sambanova';
import { LocalCustomProvider } from './local-custom';

/**
 * Mappa dei provider LLM supportati
 */
const apiProviders: Record<LLMProviderId, new (options: ProviderOptions) => ApiProvider> = {
  openai: OpenAIProvider,
  ollama: OllamaProvider,
  deepseek: DeepSeekProvider,
  together: TogetherProvider,
  mistral: MistralProvider,
  vertex: VertexProvider,
  qwen: QwenProvider,
  lmstudio: LMStudioProvider,
  'local-custom': LocalCustomProvider,
  anthropic: AnthropicProvider,
  openrouter: OpenRouterProvider,
  'vscode-lm': VsCodeLmProvider,
  bedrock: BedrockProvider,
  gemini: GeminiProvider,
  'openai-native': OpenAINativeProvider,
  requesty: RequestyProvider,
  'jarvis-ide': JarvisIdeProvider,
  litellm: LiteLlmProvider,
  asksage: AskSageProvider,
  xai: XAIProvider,
  sambanova: SambanovaProvider,
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
