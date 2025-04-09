import type { OpenAiCompatibleModelInfo, LLMProviderId } from "../shared/types/api.types.js";
import type { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { Logger } from "../shared/logger.js";

// Nota: Le funzionalità di caricamento modelli sono state spostate in providerRegistry.ts
// e le implementazioni specifiche dei provider in src/data/providers/

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);
const CACHE_FILE = join(currentDir, "models-cache.json");
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore in millisecondi

interface ModelsCache {
  timestamp: number
  models: OpenAiCompatibleModelInfo[]
}

const loadFromCache = (): OpenAiCompatibleModelInfo[] | null => {
  try {
    if (existsSync(CACHE_FILE)) {
      const cache: ModelsCache = JSON.parse(readFileSync(CACHE_FILE, "utf-8"))
      if (Date.now() - cache.timestamp < CACHE_DURATION) {
        return cache.models
      }
    }
  } catch (error) {
    console.error("Errore nel caricamento della cache:", error)
  }
  return null
}

const saveToCache = (models: OpenAiCompatibleModelInfo[]) => {
  try {
    const cache: ModelsCache = {
      timestamp: Date.now(),
      models
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
  } catch (error) {
    console.error("Errore nel salvataggio della cache:", error)
  }
}

// Nota: L'interfaccia OpenRouterApiResponse è stata spostata in src/data/providers/openrouterProvider.ts

// Nota: La funzione fetchModelsFromOpenRouter è stata spostata in src/data/providers/openrouterProvider.ts
// per supportare il pattern del Registry Dinamico dei Provider

/**
 * Recupera i modelli disponibili da un provider specifico
 * @param provider Identificatore del provider LLM
 * @param apiKey Chiave API opzionale per il provider
 * @param forceRefresh Se true, forza il refresh ignorando la cache
 * @returns Promise con array di modelli compatibili con OpenAI
 * @deprecated Usa fetchModels da providerRegistry.ts invece
 */
export async function fetchModels(provider: LLMProviderId, apiKey?: string, forceRefresh: boolean = false): Promise<OpenAiCompatibleModelInfo[]> {
  // Importa dinamicamente il ProviderRegistry per evitare dipendenze circolari
  const { fetchModels: fetchModelsFromRegistry } = await import('./providerRegistry.js');
  return fetchModelsFromRegistry(provider, apiKey, forceRefresh);
}

/**
 * Funzione di compatibilità per supportare il codice esistente
 * @deprecated Usa fetchModels('openrouter', apiKey, forceRefresh) da providerRegistry.ts invece
 */
export const loadModels = async (apiKey?: string, forceRefresh: boolean = false): Promise<OpenAiCompatibleModelInfo[]> => {
  // Importa dinamicamente il ProviderRegistry per evitare dipendenze circolari
  const { fetchModels: fetchModelsFromRegistry } = await import('./providerRegistry.js');
  return fetchModelsFromRegistry('openrouter', apiKey, forceRefresh);
}