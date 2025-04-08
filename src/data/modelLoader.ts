import { OpenAiCompatibleModelInfo } from "../shared/types/api.types.js";
import { OPENROUTER_MODELS } from "./openrouterModels.js";
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

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

const fetchModelsFromOpenRouter = async (apiKey?: string): Promise<OpenAiCompatibleModelInfo[]> => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    }

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }

    const response = await fetch("https://openrouter.ai/api/v1/models", { headers })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("API key non valida o mancante")
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // Validazione dei modelli ricevuti
    return data.data.map((model: any) => {
      if (!model.id || !model.name || !model.context_length) {
        throw new Error(`Modello non valido: ${JSON.stringify(model)}`)
      }

      return {
        id: model.id,
        name: model.name,
        contextLength: model.context_length,
        temperature: model.temperature || 0.7,
        supportsStreaming: model.supports_streaming || true,
        pricing: model.pricing ? {
          prompt: model.pricing.prompt,
          completion: model.pricing.completion
        } : undefined
      }
    })
  } catch (error) {
    console.error("Errore nel caricamento dei modelli da OpenRouter:", error)
    return OPENROUTER_MODELS // Fallback ai modelli statici
  }
}

export const loadModels = async (apiKey?: string, forceRefresh: boolean = false): Promise<OpenAiCompatibleModelInfo[]> => {
  // Se forceRefresh è true, ignora la cache
  if (!forceRefresh) {
    const cachedModels = loadFromCache()
    if (cachedModels) {
      return cachedModels
    }
  }

  // Carica da OpenRouter
  const models = await fetchModelsFromOpenRouter(apiKey)
  
  // Salva in cache per usi futuri
  saveToCache(models)
  
  return models
}