/**
 * @file modelCache.ts
 * @description Sistema di cache per i modelli LLM
 * Fornisce funzionalità di caching per i modelli di diversi provider
 */

import { LLMProviderId, OpenAiCompatibleModelInfo } from "../shared/types/api.types.js";
import { Logger } from "../shared/logger.js";

/**
 * Cache in-memory per i modelli LLM
 * Memorizza i modelli per provider per evitare chiamate API ripetute
 */
const modelCache = new Map<LLMProviderId, OpenAiCompatibleModelInfo[]>();

/**
 * Recupera i modelli dalla cache per un provider specifico
 * @param provider Identificatore del provider LLM
 * @returns Array di modelli compatibili con OpenAI o undefined se non presenti in cache
 */
export function getCachedModels(provider: LLMProviderId): OpenAiCompatibleModelInfo[] | undefined {
  return modelCache.get(provider);
}

/**
 * Salva i modelli nella cache per un provider specifico
 * @param provider Identificatore del provider LLM
 * @param models Array di modelli compatibili con OpenAI da memorizzare
 */
export function cacheModels(provider: LLMProviderId, models: OpenAiCompatibleModelInfo[]): void {
  modelCache.set(provider, models);
  Logger.debug(`Memorizzati ${models.length} modelli in cache per il provider ${provider}`);
}

/**
 * Verifica se esistono modelli in cache per un provider specifico
 * @param provider Identificatore del provider LLM
 * @returns true se esistono modelli in cache, false altrimenti
 */
export function hasCachedModels(provider: LLMProviderId): boolean {
  return modelCache.has(provider) && (modelCache.get(provider)?.length ?? 0) > 0;
}

/**
 * Cancella la cache per un provider specifico
 * @param provider Identificatore del provider LLM
 */
export function clearCachedModels(provider: LLMProviderId): void {
  modelCache.delete(provider);
  Logger.debug(`Cache modelli cancellata per il provider ${provider}`);
}

/**
 * Cancella tutta la cache dei modelli
 */
export function clearAllCachedModels(): void {
  modelCache.clear();
  Logger.debug('Cache modelli completamente cancellata');
}