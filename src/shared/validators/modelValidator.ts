/**
 * @file modelValidator.ts
 * @description Utility per la validazione di oggetti ModelInfo
 */

import { getLogger } from '../logging';

const logger = getLogger('modelValidator');

/**
 * Provider ID validi supportati dal sistema
 */
export const VALID_PROVIDERS = [
  'openai',
  'anthropic',
  'openrouter',
  'azureopenai',
  'local',
] as const;

export type ProviderId = (typeof VALID_PROVIDERS)[number];

/**
 * Verifica se il provider ID è valido
 */
export function isValidProviderId(providerId: any): providerId is ProviderId {
  return typeof providerId === 'string' && VALID_PROVIDERS.includes(providerId as ProviderId);
}

/**
 * Tipo base per tutte le informazioni sui modelli
 */
export interface ModelInfoBase {
  id: string;
  name: string;
  provider: ProviderId;
  contextLength: number;
}

/**
 * Verifica se un oggetto è un ModelInfoBase valido
 */
export function isModelInfoBase(model: any): model is ModelInfoBase {
  if (!model || typeof model !== 'object') {
    return false;
  }

  const hasId = typeof model.id === 'string' && model.id.length > 0;
  const hasName = typeof model.name === 'string' && model.name.length > 0;
  const hasValidProvider = isValidProviderId(model.provider);
  const hasContextLength = typeof model.contextLength === 'number' && model.contextLength > 0;

  return hasId && hasName && hasValidProvider && hasContextLength;
}

/**
 * Estensione di ModelInfoBase con proprietà standard opzionali
 */
export interface ModelInfoStandard extends ModelInfoBase {
  maxTokens?: number;
  description?: string;
  supported?: boolean;
}

/**
 * Verifica se un oggetto è un ModelInfoStandard valido
 */
export function isModelInfoStandard(model: any): model is ModelInfoStandard {
  if (!isModelInfoBase(model)) {
    return false;
  }

  // Verifica che maxTokens sia un numero (se presente)
  if (model.maxTokens !== undefined && typeof model.maxTokens !== 'number') {
    return false;
  }

  // Verifica che description sia una stringa (se presente)
  if (model.description !== undefined && typeof model.description !== 'string') {
    return false;
  }

  // Verifica che supported sia un booleano (se presente)
  if (model.supported !== undefined && typeof model.supported !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Informazioni di prezzo per un modello
 */
export interface ModelPricing {
  prompt?: number;
  completion?: number;
  unit?: 'token' | 'character' | 'message';
}

/**
 * Tipo completo per tutte le informazioni sui modelli
 */
export interface ModelInfo extends ModelInfoStandard {
  pricing?: ModelPricing;
  supporting?: {
    images?: boolean;
    json?: boolean;
    functions?: boolean;
    vision?: boolean;
  };
}

/**
 * Verifica se un oggetto è un ModelInfo valido
 */
export function isModelInfo(model: any): model is ModelInfo {
  if (!isModelInfoStandard(model)) {
    return false;
  }

  // Verifica il pricing (se presente)
  if (model.pricing !== undefined) {
    if (typeof model.pricing !== 'object' || model.pricing === null) {
      return false;
    }

    const pricing = model.pricing as ModelPricing;

    // Verifica che prompt e completion siano numeri (se presenti)
    if (pricing.prompt !== undefined && typeof pricing.prompt !== 'number') {
      return false;
    }

    if (pricing.completion !== undefined && typeof pricing.completion !== 'number') {
      return false;
    }

    // Verifica che unit sia uno dei valori consentiti (se presente)
    if (pricing.unit !== undefined && !['token', 'character', 'message'].includes(pricing.unit)) {
      return false;
    }
  }

  // Verifica supporting (se presente)
  if (model.supporting !== undefined) {
    if (typeof model.supporting !== 'object' || model.supporting === null) {
      return false;
    }

    const supporting = model.supporting;

    // Verifica che tutte le proprietà siano booleani (se presenti)
    if (supporting.images !== undefined && typeof supporting.images !== 'boolean') {
      return false;
    }

    if (supporting.json !== undefined && typeof supporting.json !== 'boolean') {
      return false;
    }

    if (supporting.functions !== undefined && typeof supporting.functions !== 'boolean') {
      return false;
    }

    if (supporting.vision !== undefined && typeof supporting.vision !== 'boolean') {
      return false;
    }
  }

  return true;
}

/**
 * Tipo per modelli compatibili con OpenAI
 */
export interface OpenAiCompatibleModelInfo extends ModelInfo {
  provider: 'openai';
  supportsStreaming?: boolean;
  supportsFunctions?: boolean;
  supportsImageInput?: boolean;
  supportsJsonMode?: boolean;
}

/**
 * Verifica se un oggetto è un OpenAiCompatibleModelInfo valido
 */
export function isOpenAiCompatibleModelInfo(model: any): model is OpenAiCompatibleModelInfo {
  if (!isModelInfo(model) || model.provider !== 'openai') {
    return false;
  }

  // Verifica le proprietà specifiche di OpenAI se presenti
  if (model.supportsStreaming !== undefined && typeof model.supportsStreaming !== 'boolean') {
    return false;
  }

  if (model.supportsFunctions !== undefined && typeof model.supportsFunctions !== 'boolean') {
    return false;
  }

  if (model.supportsImageInput !== undefined && typeof model.supportsImageInput !== 'boolean') {
    return false;
  }

  if (model.supportsJsonMode !== undefined && typeof model.supportsJsonMode !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Tipo per modelli Anthropic
 */
export interface AnthropicModelInfo extends ModelInfo {
  provider: 'anthropic';
  version?: string;
  supportsJsonMode?: boolean;
  supportsVision?: boolean;
}

/**
 * Verifica se un oggetto è un AnthropicModelInfo valido
 */
export function isAnthropicModelInfo(model: any): model is AnthropicModelInfo {
  if (!isModelInfo(model) || model.provider !== 'anthropic') {
    return false;
  }

  // Verifica la versione (se presente)
  if (model.version !== undefined && typeof model.version !== 'string') {
    return false;
  }

  // Verifica le proprietà specifiche di Anthropic
  if (model.supportsJsonMode !== undefined && typeof model.supportsJsonMode !== 'boolean') {
    return false;
  }

  if (model.supportsVision !== undefined && typeof model.supportsVision !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Tipo per modelli OpenRouter
 */
export interface OpenRouterModelInfo extends ModelInfo {
  provider: 'openrouter';
  originalProvider: string;
  performanceScore?: number;
}

/**
 * Verifica se un oggetto è un OpenRouterModelInfo valido
 */
export function isOpenRouterModelInfo(model: any): model is OpenRouterModelInfo {
  if (!isModelInfo(model) || model.provider !== 'openrouter') {
    return false;
  }

  // Verifica originalProvider
  if (typeof model.originalProvider !== 'string' || model.originalProvider.length === 0) {
    return false;
  }

  // Verifica il punteggio di performance (se presente)
  if (model.performanceScore !== undefined && typeof model.performanceScore !== 'number') {
    return false;
  }

  return true;
}

/**
 * Tipo per modelli Azure OpenAI
 */
export interface AzureOpenAIModelInfo extends ModelInfo {
  provider: 'azureopenai';
  deploymentId: string;
  apiVersion?: string;
}

/**
 * Verifica se un oggetto è un AzureOpenAIModelInfo valido
 */
export function isAzureOpenAIModelInfo(model: any): model is AzureOpenAIModelInfo {
  if (!isModelInfo(model) || model.provider !== 'azureopenai') {
    return false;
  }

  // Verifica deploymentId
  if (typeof model.deploymentId !== 'string' || model.deploymentId.length === 0) {
    return false;
  }

  // Verifica apiVersion (se presente)
  if (model.apiVersion !== undefined && typeof model.apiVersion !== 'string') {
    return false;
  }

  return true;
}

/**
 * Filtra un array di modelli, mantenendo solo quelli validi
 * @param models Array di modelli da validare
 * @param providerName Nome del provider (per logging)
 * @returns Array di modelli validi
 */
export function validateModelInfoArray<T extends ModelInfoBase>(
  models: any,
  providerName: string
): T[] {
  // Gestione di input non array
  if (!Array.isArray(models)) {
    logger.warn(`${providerName}: Ricevuto un input non array per i modelli`);
    return [];
  }

  // Filtra solo i modelli validi
  const validModels = models.filter((model) => {
    const isValid = isModelInfoBase(model);
    if (!isValid) {
      logger.warn(`${providerName}: Modello non valido scartato: ${JSON.stringify(model)}`);
    }
    return isValid;
  }) as T[];

  logger.info(
    `${providerName}: Validati ${validModels.length} modelli validi di ${models.length} totali`
  );
  return validModels;
}
