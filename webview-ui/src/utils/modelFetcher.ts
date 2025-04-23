/**
 * @file modelFetcher.ts
 * @description Utility per il recupero dei modelli LLM dai vari provider
 */

import { LLMProviderId } from '@shared/types/providers.types';
import { OpenAiCompatibleModelInfo, FetchModelsResponse, ModelCacheEntry } from '@shared/types/llm.types';
import { vscode } from './vscode';
import { webviewBridge } from './WebviewBridge';

/**
 * Cache locale dei modelli per provider
 * Riduce le chiamate ripetute all'extension
 */
const modelCache: ModelCacheEntry | null = null;

// Durata della cache (5 minuti)
const CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Recupera i modelli disponibili per un provider specifico
 * Implementa caching in-memory e fallback
 * 
 * @param provider Identificatore del provider (openrouter, anthropic, ecc.)
 * @param apiKey Chiave API opzionale per il provider
 * @returns Promise con array di modelli compatibili
 */
export async function fetchModels(forceRefresh = false): Promise<OpenAiCompatibleModelInfo[]> {
  // Return cached models if available and not expired
  if (!forceRefresh && modelCache && Date.now() - modelCache.timestamp < CACHE_TIMEOUT) {
    return modelCache.models;
  }

  try {
    const response = await webviewBridge.sendMessage<FetchModelsResponse>({
      type: 'requestModels',
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Update cache
    modelCache = {
      timestamp: Date.now(),
      models: response.models,
    };

    return response.models;
  } catch (error) {
    // Clear cache on error
    modelCache = null;
    throw error;
  }
}

/**
 * Recupera il modello predefinito per un provider
 * 
 * @param provider Identificatore del provider
 * @param apiKey Chiave API opzionale
 * @returns Il modello predefinito o undefined
 */
export async function getDefaultModel(
  provider: LLMProviderId,
  apiKey?: string
): Promise<OpenAiCompatibleModelInfo | undefined> {
  try {
    const models = await fetchModels(false);
    return models.length > 0 ? models[0] : undefined;
  } catch (error) {
    console.error(`[modelFetcher] Errore nel recupero modello predefinito per ${provider}:`, error);
    return undefined;
  }
}

/**
 * Clears the model cache, forcing next fetch to get fresh data
 */
export function clearModelCache(): void {
  modelCache = null;
}