/**
 * @file providerRegistry.ts
 * @description Registry dinamico per i provider di modelli LLM
 * Implementa un sistema di lookup dinamico provider → loader
 */

import type { OpenAiCompatibleModelInfo, LLMProviderId } from "../shared/types/api.types.js";
import { fetchModelsFromOpenRouter, getFallbackModels as getOpenRouterFallbackModels } from "./providers/openrouterProvider.js";
import { fetchModelsFromAnthropic, getFallbackModels as getAnthropicFallbackModels } from "./providers/anthropicProvider.js";
import { getCachedModels, cacheModels } from "./modelCache.js";
import { Logger } from "../shared/logger.js";

/**
 * Tipo per le funzioni di caricamento modelli
 */
export type ModelLoaderFn = (apiKey?: string) => Promise<OpenAiCompatibleModelInfo[]>;

/**
 * Tipo per le funzioni di fallback statiche
 */
export type FallbackLoaderFn = () => OpenAiCompatibleModelInfo[];

/**
 * Interfaccia per le informazioni di un provider
 */
export interface ProviderInfo {
  /** Funzione per caricare i modelli dal provider */
  loader: ModelLoaderFn;
  /** Funzione per ottenere modelli di fallback statici */
  fallback: FallbackLoaderFn;
}

/**
 * Registry dei provider di modelli
 * Mappa gli identificatori dei provider alle loro funzioni di caricamento
 */
const providerRegistry: Record<LLMProviderId, ProviderInfo> = {
  // Provider OpenRouter
  openrouter: {
    loader: (apiKey?: string) => fetchModelsFromOpenRouter(apiKey),
    fallback: getOpenRouterFallbackModels
  },
  // Provider Anthropic (implementazione completa)
  anthropic: {
    loader: (apiKey?: string) => fetchModelsFromAnthropic(apiKey),
    fallback: getAnthropicFallbackModels
  },
  // Provider OpenAI (ancora placeholder)
  openai: {
    loader: async () => {
      Logger.warn("Provider OpenAI non ancora implementato");
      return [];
    },
    fallback: () => []
  },
  // Provider di default (implementazione vuota)
  default: {
    loader: async () => [],
    fallback: () => []
  },
  // Implementazioni vuote per gli altri provider richiesti dal tipo LLMProviderId
  azureopenai: { loader: async () => [], fallback: () => [] },
  vertex: { loader: async () => [], fallback: () => [] },
  aws: { loader: async () => [], fallback: () => [] },
  gemini: { loader: async () => [], fallback: () => [] },
  ollama: { loader: async () => [], fallback: () => [] },
  lmstudio: { loader: async () => [], fallback: () => [] },
  deepseek: { loader: async () => [], fallback: () => [] },
  qwen: { loader: async () => [], fallback: () => [] },
  mistral: { loader: async () => [], fallback: () => [] },
  litellm: { loader: async () => [], fallback: () => [] },
  asksage: { loader: async () => [], fallback: () => [] },
  sambanova: { loader: async () => [], fallback: () => [] },
  xai: { loader: async () => [], fallback: () => [] },
  'jarvis-ide': { loader: async () => [], fallback: () => [] },
  zero: { loader: async () => [], fallback: () => [] }
};

/**
 * Registra un nuovo provider nel registry
 * @param providerId Identificatore del provider
 * @param providerInfo Informazioni del provider (loader e fallback)
 */
export function registerProvider(providerId: LLMProviderId, providerInfo: ProviderInfo): void {
  providerRegistry[providerId] = providerInfo;
  Logger.debug(`Provider ${providerId} registrato nel registry`);
}

/**
 * Verifica se un provider è registrato nel registry
 * @param providerId Identificatore del provider
 * @returns true se il provider è registrato, false altrimenti
 */
export function isProviderRegistered(providerId: LLMProviderId): boolean {
  return providerId in providerRegistry;
}

/**
 * Recupera i modelli disponibili da un provider specifico
 * @param provider Identificatore del provider LLM
 * @param apiKey Chiave API opzionale per il provider
 * @param forceRefresh Se true, forza il refresh ignorando la cache
 * @returns Promise con array di modelli compatibili con OpenAI
 */
export async function fetchModels(
  provider: LLMProviderId, 
  apiKey?: string, 
  forceRefresh: boolean = false
): Promise<OpenAiCompatibleModelInfo[]> {
  // Se il provider non è registrato, restituisci un array vuoto
  if (!isProviderRegistered(provider)) {
    Logger.warn(`Provider ${provider} non registrato nel registry`);
    return [];
  }

  // Se non è richiesto un refresh forzato, controlla la cache in memoria
  if (!forceRefresh) {
    const cachedModels = getCachedModels(provider);
    if (cachedModels && cachedModels.length > 0) {
      Logger.debug(`Utilizzando modelli ${provider} dalla cache in memoria`);
      return cachedModels;
    }
  }

  // Recupera le informazioni del provider dal registry
  const providerInfo = providerRegistry[provider];
  
  try {
    // Carica i modelli usando la funzione di caricamento del provider
    const models = await providerInfo.loader(apiKey);
    
    // Salva i modelli nella cache in memoria
    if (models.length > 0) {
      cacheModels(provider, models);
    }

    return models;
  } catch (error) {
    Logger.error(`Errore nel recupero dei modelli dal provider ${provider}:`, error);
    
    // Recupera i modelli dalla cache se disponibili
    const cachedModels = getCachedModels(provider);
    if (cachedModels && cachedModels.length > 0) {
      Logger.warn(`Fallback ai modelli ${provider} dalla cache`);
      return cachedModels;
    }
    
    // Fallback ai modelli statici del provider
    Logger.warn(`Fallback ai modelli ${provider} statici`);
    return providerInfo.fallback();
  }
}

/**
 * Funzione di compatibilità per supportare il codice esistente
 * @deprecated Usa fetchModels('openrouter', apiKey, forceRefresh) invece
 */
export const loadModels = async (
  apiKey?: string, 
  forceRefresh: boolean = false
): Promise<OpenAiCompatibleModelInfo[]> => {
  return fetchModels('openrouter', apiKey, forceRefresh);
}