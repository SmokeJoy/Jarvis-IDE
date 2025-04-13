/**
 * @file anthropicProvider.ts
 * @description Provider specifico per Anthropic
 * Implementa le funzionalità di caricamento modelli per Anthropic
 */

import { OpenAiCompatibleModelInfo, LLMProviderId } from '../../shared/types/api.types';
import { ANTHROPIC_MODELS } from './anthropicModels';
import { Logger } from '../../shared/logger';

/**
 * Recupera i modelli disponibili da Anthropic
 * @param apiKey Chiave API opzionale per Anthropic
 * @returns Promise con array di modelli compatibili con OpenAI
 */
export const fetchModelsFromAnthropic = async (
  apiKey?: string
): Promise<OpenAiCompatibleModelInfo[]> => {
  try {
    // Se avessimo accesso all'API Anthropic, qui dovremmo fare una chiamata
    // per ottenere la lista dei modelli dinamicamente

    // Per ora, utilizziamo i modelli statici definiti in anthropicModels.ts
    Logger.info('Utilizzando modelli statici Anthropic');

    // In futuro, qui si implementerà la chiamata all'API Anthropic
    // utilizzando l'SDK ufficiale (@anthropic-ai/sdk)

    return ANTHROPIC_MODELS;
  } catch (error) {
    Logger.warn('Errore nel caricamento dei modelli da Anthropic:', error);
    throw error; // Rilancia l'errore per gestirlo nel ProviderRegistry
  }
};

/**
 * Restituisce i modelli statici di fallback per Anthropic
 * @returns Array di modelli compatibili con OpenAI
 */
export const getFallbackModels = (): OpenAiCompatibleModelInfo[] => {
  return ANTHROPIC_MODELS;
};

/**
 * Restituisce il modello predefinito per Anthropic
 * @returns Il modello Anthropic predefinito (Claude 3.7 Sonnet)
 */
export const getDefaultAnthropicModel = (): OpenAiCompatibleModelInfo => {
  // Utilizziamo Claude 3.7 Sonnet come modello predefinito
  const defaultModel = ANTHROPIC_MODELS.find((model) => model.id === 'claude-3-7-sonnet-20250219');

  // Fallback a qualsiasi modello disponibile se il modello predefinito non è presente
  return defaultModel || ANTHROPIC_MODELS[0];
};
