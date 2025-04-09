/**
 * @file modelLoader.ts
 * @description Sistema centralizzato per il caricamento dei modelli LLM
 * Implementa un'interfaccia unificata per l'accesso ai modelli da diversi provider
 * Utilizza il pattern del Registry Dinamico dei Provider per massima estensibilità
 */

import type { OpenAiCompatibleModelInfo, LLMProviderId } from "../shared/types/api.types.js";
import { getCachedModels, cacheModels, hasCachedModels } from "./modelCache.js";
import { fetchModels as fetchModelsFromRegistry } from "./providerRegistry.js";
import { Logger } from "../shared/logger.js";

/**
 * Recupera i modelli disponibili da un provider specifico
 * Implementa un flusso unificato: cache in-memory → provider registry → fallback
 * 
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
  try {
    // Utilizza direttamente il fetchModels dal providerRegistry
    // che implementa già la logica di cache, fetch e fallback
    const models = await fetchModelsFromRegistry(provider, apiKey, forceRefresh);
    
    // Validazione dei modelli restituiti per garantire conformità con OpenAiCompatibleModelInfo
    validateModelsType(models, provider);
    
    return models;
  } catch (error) {
    Logger.error(`Errore nel caricamento dei modelli dal provider ${provider}:`, error);
    
    // Ultimo tentativo: restituisci un array vuoto se tutto fallisce
    return [];
  }
}

/**
 * Validazione dei tipi per i modelli restituiti dai provider
 * Garantisce che tutti i modelli rispettino la struttura richiesta
 * 
 * @param models Array di modelli da validare
 * @param provider Identificatore del provider per logging
 */
function validateModelsType(models: OpenAiCompatibleModelInfo[], provider: LLMProviderId): void {
  if (!Array.isArray(models)) {
    Logger.warn(`Provider ${provider} ha restituito dati non validi (non è un array)`);
    return;
  }
  
  const invalidModels = models.filter(model => 
    !model.id || 
    !model.name || 
    !model.provider ||
    typeof model.contextLength !== 'number'
  );
  
  if (invalidModels.length > 0) {
    Logger.warn(`Provider ${provider} ha restituito ${invalidModels.length} modelli con struttura non valida`);
  }
}

/**
 * Recupera il modello predefinito per un provider specifico
 * 
 * @param provider Identificatore del provider LLM
 * @param apiKey Chiave API opzionale per il provider
 * @returns Promise con il modello predefinito o undefined se non disponibile
 */
export async function getDefaultModel(
  provider: LLMProviderId,
  apiKey?: string
): Promise<OpenAiCompatibleModelInfo | undefined> {
  try {
    // Ottieni modelli dal provider
    const models = await fetchModels(provider, apiKey);
    
    if (models.length === 0) {
      return undefined;
    }
    
    // Strategia di selezione modello predefinito (può essere migliorata in futuro)
    // Attualmente seleziona il primo modello disponibile
    return models[0];
  } catch (error) {
    Logger.error(`Errore nel recupero del modello predefinito per ${provider}:`, error);
    return undefined;
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
  Logger.debug("Chiamata loadModels deprecata, utilizzo fetchModels('openrouter') al suo posto");
  return fetchModels('openrouter', apiKey, forceRefresh);
}