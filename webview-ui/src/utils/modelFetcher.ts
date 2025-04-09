/**
 * @file modelFetcher.ts
 * @description Utility per il recupero dei modelli LLM dai vari provider
 */

import type { OpenAiCompatibleModelInfo, LLMProviderId } from '../types/models';
import { vscode } from './vscode';

interface FetchModelsResponse {
  models: OpenAiCompatibleModelInfo[];
  error?: string;
}

/**
 * Cache locale dei modelli per provider
 * Riduce le chiamate ripetute all'extension
 */
const modelCache = new Map<string, {
  timestamp: number;
  models: OpenAiCompatibleModelInfo[];
}>();

// Durata della cache (10 minuti)
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * Recupera i modelli disponibili per un provider specifico
 * Implementa caching in-memory e fallback
 * 
 * @param provider Identificatore del provider (openrouter, anthropic, ecc.)
 * @param apiKey Chiave API opzionale per il provider
 * @returns Promise con array di modelli compatibili
 */
export async function fetchModels(
  provider: LLMProviderId,
  apiKey?: string
): Promise<OpenAiCompatibleModelInfo[]> {
  // Chiave di cache: provider + primi 5 caratteri dell'apiKey (se presente)
  const cacheKey = `${provider}_${apiKey ? apiKey.substring(0, 5) : 'default'}`;
  
  // Controlla se c'è una cache valida
  const cachedData = modelCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
    console.debug(`[modelFetcher] Utilizzando cache per ${provider}`);
    return cachedData.models;
  }
  
  try {
    // Richiedi i modelli all'extension tramite una promessa
    return await new Promise<OpenAiCompatibleModelInfo[]>((resolve, reject) => {
      // ID univoco per questa richiesta
      const requestId = `fetch_models_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Handler per la risposta
      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        if (message.requestId === requestId) {
          // Rimuovi l'handler una volta ricevuta la risposta
          window.removeEventListener('message', messageHandler);
          
          if (message.error) {
            reject(new Error(message.error));
          } else if (Array.isArray(message.models)) {
            // Salva nella cache
            modelCache.set(cacheKey, {
              timestamp: Date.now(),
              models: message.models
            });
            
            resolve(message.models);
          } else {
            reject(new Error('Formato risposta non valido'));
          }
        }
      };
      
      // Registra l'handler
      window.addEventListener('message', messageHandler);
      
      // Invia richiesta all'extension
      vscode.postMessage({
        command: 'fetch_models',
        provider,
        apiKey,
        requestId
      });
      
      // Timeout dopo 5 secondi
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        reject(new Error('Timeout nella richiesta modelli'));
      }, 5000);
    });
  } catch (error) {
    console.error(`[modelFetcher] Errore nel recupero modelli per ${provider}:`, error);
    
    // Restituisci la cache se disponibile, anche se scaduta
    if (cachedData) {
      console.warn(`[modelFetcher] Utilizzando cache scaduta per ${provider}`);
      return cachedData.models;
    }
    
    // Se non c'è cache, propaga l'errore
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
    const models = await fetchModels(provider, apiKey);
    return models.length > 0 ? models[0] : undefined;
  } catch (error) {
    console.error(`[modelFetcher] Errore nel recupero modello predefinito per ${provider}:`, error);
    return undefined;
  }
} 