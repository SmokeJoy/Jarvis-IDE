/**
 * Router centrale per i provider LLM
 * Permette di ottenere un'istanza di provider configurata in base al nome
 */

import { BaseLLMProvider } from './BaseLLMProvider';

// Provider locali
import { OllamaProvider } from './local/OllamaProvider';
import { LMStudioProvider } from './local/LMStudioProvider';
import { GGUFProvider, GGUFConfig } from './local/GGUFProvider';
import { LMDeployProvider } from './local/LMDeployProvider';

// Provider remoti
import { OpenAIProvider } from './remote/OpenAIProvider';
import { AnthropicProvider } from './remote/AnthropicProvider';
import { MistralProvider } from './remote/MistralProvider';
import { GroqProvider } from './remote/GroqProvider';
import { GoogleAIProvider } from './remote/GoogleAIProvider';

// Costanti per i nomi dei provider
export const PROVIDER_NAMES = {
  // Provider locali
  OLLAMA: 'ollama',
  LM_STUDIO: 'lmstudio',
  GGUF: 'gguf',
  LM_DEPLOY: 'lmdeploy',

  // Provider remoti
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  MISTRAL: 'mistral',
  GROQ: 'groq',
  GOOGLE_AI: 'googleai',
};

// Lista di tutti i provider supportati
export const SUPPORTED_PROVIDERS = Object.values(PROVIDER_NAMES);

// Opzioni di configurazione per il provider
export interface ProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  ggufConfig?: GGUFConfig;
}

/**
 * Verifica se un provider è supportato
 * @param name Nome del provider da verificare
 * @returns true se il provider è supportato, false altrimenti
 */
export function isProviderSupported(name: string): boolean {
  return SUPPORTED_PROVIDERS.includes(name.toLowerCase());
}

/**
 * Restituisce la lista dei provider locali disponibili
 * @returns Array con i nomi dei provider locali
 */
export function getLocalProviders(): string[] {
  return [
    PROVIDER_NAMES.OLLAMA,
    PROVIDER_NAMES.LM_STUDIO,
    PROVIDER_NAMES.GGUF,
    PROVIDER_NAMES.LM_DEPLOY,
  ];
}

/**
 * Restituisce la lista dei provider remoti disponibili
 * @returns Array con i nomi dei provider remoti
 */
export function getRemoteProviders(): string[] {
  return [
    PROVIDER_NAMES.OPENAI,
    PROVIDER_NAMES.ANTHROPIC,
    PROVIDER_NAMES.MISTRAL,
    PROVIDER_NAMES.GROQ,
    PROVIDER_NAMES.GOOGLE_AI,
  ];
}

/**
 * Ottiene un'istanza del provider richiesto, già configurata e pronta all'uso
 * @param name Nome del provider (es. 'ollama', 'openai', 'groq')
 * @param options Opzioni di configurazione (es. apiKey, baseUrl)
 * @returns Istanza di BaseLLMProvider configurata
 * @throws Error se il provider non è supportato o manca una configurazione necessaria
 */
export function getProvider(name: string, options: ProviderOptions = {}): BaseLLMProvider {
  const providerName = name.toLowerCase();

  if (!isProviderSupported(providerName)) {
    throw new Error(
      `Provider LLM non supportato: ${name}. Provider disponibili: ${SUPPORTED_PROVIDERS.join(', ')}`
    );
  }

  // Ottieni l'istanza del provider appropriato in base al nome
  switch (providerName) {
    // Provider locali
    case PROVIDER_NAMES.OLLAMA:
      return new OllamaProvider(options.baseUrl);

    case PROVIDER_NAMES.LM_STUDIO:
      return new LMStudioProvider(options.baseUrl);

    case PROVIDER_NAMES.GGUF:
      if (!options.ggufConfig) {
        throw new Error(
          `${PROVIDER_NAMES.GGUF.toUpperCase()}Provider richiede ggufConfig con binaryPath e modelsPath`
        );
      }
      return new GGUFProvider(options.ggufConfig);

    case PROVIDER_NAMES.LM_DEPLOY:
      return new LMDeployProvider(options.baseUrl);

    // Provider remoti
    case PROVIDER_NAMES.OPENAI:
      if (!options.apiKey) {
        throw new Error(`${PROVIDER_NAMES.OPENAI.toUpperCase()}Provider richiede una API key`);
      }
      return new OpenAIProvider(options.apiKey, options.baseUrl);

    case PROVIDER_NAMES.ANTHROPIC:
      if (!options.apiKey) {
        throw new Error(`${PROVIDER_NAMES.ANTHROPIC.toUpperCase()}Provider richiede una API key`);
      }
      return new AnthropicProvider(options.apiKey, options.baseUrl);

    case PROVIDER_NAMES.MISTRAL:
      if (!options.apiKey) {
        throw new Error(`${PROVIDER_NAMES.MISTRAL.toUpperCase()}Provider richiede una API key`);
      }
      return new MistralProvider(options.apiKey, options.baseUrl);

    case PROVIDER_NAMES.GROQ:
      if (!options.apiKey) {
        throw new Error(`${PROVIDER_NAMES.GROQ.toUpperCase()}Provider richiede una API key`);
      }
      return new GroqProvider(options.apiKey, options.baseUrl);

    case PROVIDER_NAMES.GOOGLE_AI:
      if (!options.apiKey) {
        throw new Error(`${PROVIDER_NAMES.GOOGLE_AI.toUpperCase()}Provider richiede una API key`);
      }
      return new GoogleAIProvider(options.apiKey, options.baseUrl);

    default:
      // Questo caso non dovrebbe mai verificarsi grazie al controllo isProviderSupported,
      // ma lo includiamo per sicurezza e completezza TypeScript
      throw new Error(`Provider LLM non supportato: ${name}`);
  }
}

/**
 * Utility per inizializzare velocemente un provider con le impostazioni comuni
 * @param settings Impostazioni della configurazione globale
 * @returns Provider LLM configurato in base alle impostazioni
 */
export function getProviderFromSettings(settings: any): BaseLLMProvider | null {
  const providerName = settings.provider?.name;

  if (!providerName || !isProviderSupported(providerName)) {
    console.warn(`Provider '${providerName}' non valido o non supportato`);
    return null;
  }

  try {
    const options: ProviderOptions = {};

    // Configura le opzioni in base al provider
    if (getRemoteProviders().includes(providerName)) {
      options.apiKey = settings.provider?.apiKey;
      options.baseUrl = settings.provider?.baseUrl;
    } else if (providerName === PROVIDER_NAMES.GGUF) {
      options.ggufConfig = settings.provider?.ggufConfig;
    } else {
      options.baseUrl = settings.provider?.baseUrl;
    }

    return getProvider(providerName, options);
  } catch (error) {
    console.error(`Errore nella creazione del provider da impostazioni:`, error);
    return null;
  }
}
