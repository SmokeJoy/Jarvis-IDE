/**
 * @file openrouterProvider.ts
 * @description Provider specifico per OpenRouter
 * Implementa le funzionalità di caricamento modelli per OpenRouter
 */

import { OpenAiCompatibleModelInfo, OpenRouterModelInfo, LLMProviderId } from "../../shared/types/api.types.js";
import { OPENROUTER_MODELS } from "../openrouterModels.js";
import { isOpenRouterModelInfo } from "../../shared/validators.js";
import { Logger } from "../../shared/logger.js";

/**
 * Interfaccia per la risposta dell'API di OpenRouter
 * Definisce la struttura esatta della risposta per una tipizzazione più forte
 */
interface OpenRouterApiResponse {
  data: OpenRouterModelInfo[];
}

/**
 * Recupera i modelli disponibili da OpenRouter
 * @param apiKey Chiave API opzionale per OpenRouter
 * @returns Promise con array di modelli compatibili con OpenAI
 */
export const fetchModelsFromOpenRouter = async (apiKey?: string): Promise<OpenAiCompatibleModelInfo[]> => {
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

    const data = await response.json() as OpenRouterApiResponse
    
    // Validazione dei modelli ricevuti usando il validatore dinamico
    return data.data.filter(isOpenRouterModelInfo).map((model: OpenRouterModelInfo) => {
      // Conversione da OpenRouterModelInfo a OpenAiCompatibleModelInfo
      return {
        id: model.id,
        name: model.name,
        contextLength: model.context_length,
        temperature: 0.7, // Valore predefinito se non specificato
        supportsStreaming: true, // Valore predefinito
        pricing: model.pricing ? {
          prompt: model.pricing.prompt,
          completion: model.pricing.completion
        } : undefined,
        provider: 'openrouter' as const, // Tipizzazione esplicita come LLMProviderId
        description: model.description
      }
    })
  } catch (error) {
    Logger.warn("Errore nel caricamento dei modelli da OpenRouter:", error)
    throw error; // Rilancia l'errore per gestirlo nel ProviderRegistry
  }
}

/**
 * Restituisce i modelli statici di fallback per OpenRouter
 * @returns Array di modelli compatibili con OpenAI
 */
export const getFallbackModels = (): OpenAiCompatibleModelInfo[] => {
  return OPENROUTER_MODELS;
}