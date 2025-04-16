/**
 * @file provider-registry.ts
 * @description Registro centralizzato per i provider LLM
 * @version 1.0.0
 *
 * Implementa un layer di astrazione per i provider LLM con supporto dinamico
 */

import { logger } from '../utils/logger';
import type { LLMProviderHandler, LLMProviderId } from '@shared/types/llm.types';
import { OpenAIProvider } from './remote/OpenAIProvider';
import { JarvisProvider } from './remote/JarvisProvider';
import { OpenRouterProvider } from './remote/OpenRouterProvider';

/**
 * Interfaccia base per tutti i parametri di configurazione dei provider
 */
export interface ProviderParams {
  /** Nome del provider da utilizzare */
  provider?: string;
  /** Parametri specifici del provider */
  [key: string]: any;
}

/**
 * Opzioni per le richieste ai modelli LLM
 */
export interface LLMRequestOptions {
  /** Prompt o messaggio da inviare al modello */
  prompt: string;
  /** Modello specifico da utilizzare (opzionale) */
  model?: string;
  /** Temperatura per il sampling (0.0-1.0) */
  temperature?: number;
  /** Numero massimo di token da generare */
  maxTokens?: number;
  /** Token di stop per terminare la generazione */
  stopTokens?: string[];
  /** Parametri specifici del provider */
  providerParams?: ProviderParams;
}

/**
 * Configurazione per le validazioni dei parametri
 */
export interface ValidationRules {
  /** Campi richiesti */
  required?: string[];
  /** Limiti per i valori numerici: {campo: [min, max]} */
  numericRanges?: Record<string, [number, number]>;
  /** Valori enumerati validi: {campo: [valore1, valore2, ...]} */
  enums?: Record<string, string[]>;
  /** Regole per validare le stringhe: {campo: {minLength, maxLength, regex}} */
  stringRules?: Record<
    string,
    {
      minLength?: number;
      maxLength?: number;
      regex?: RegExp;
    }
  >;
}

/**
 * Risposta base da un provider LLM
 */
export interface LLMResponse {
  text: string;
  model: string;
  tokenUsage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Modello LLM supportato da un provider
 */
export interface Model {
  id: string;
  name: string;
  provider: LLMProviderId;
  contextSize?: number;
  supportsStreaming?: boolean;
  supportsFunctions?: boolean;
  maxOutputTokens?: number;
  tags?: string[];
}

/**
 * Handler di base per i provider LLM
 */
export interface LLMProviderHandler {
  /** Nome univoco del provider */
  readonly name: string;
  /** Descrizione del provider */
  readonly description?: string;
  /** Flag che indica se il provider è attualmente disponibile */
  readonly isAvailable: boolean;
  /** Configurazione corrente del provider */
  readonly config?: Record<string, any>;

  /**
   * Aggiorna la configurazione del provider
   * @param config Nuova configurazione
   */
  updateConfig?(config: Record<string, any>): void;

  /**
   * Effettua una chiamata al modello
   * @param options Opzioni della richiesta
   * @returns Promise con la risposta del modello
   */
  call(options: LLMRequestOptions): Promise<LLMResponse>;

  /**
   * Ottiene la lista dei modelli disponibili
   * @returns Promise con l'array dei modelli
   */
  getAvailableModels(): Promise<Model[]>;

  /**
   * Valida le opzioni della richiesta
   * @param options Opzioni da validare
   * @returns true se valide, false altrimenti
   */
  validateRequest(options: LLMRequestOptions): boolean;
}

/**
 * Tipo di classe di implementazione di provider
 */
export type LLMProviderClass = new () => LLMProviderHandler;

/**
 * Valida un oggetto rispetto a un insieme di regole
 * @param obj Oggetto da validare
 * @param rules Regole di validazione
 * @returns true se l'oggetto è valido, false altrimenti
 */
export function validateObject(obj: Record<string, any>, rules: ValidationRules): boolean {
  // Verifica campi richiesti
  if (rules.required) {
    for (const field of rules.required) {
      if (obj[field] === undefined || obj[field] === null) {
        console.error(`Campo richiesto mancante: ${field}`);
        return false;
      }
    }
  }

  // Verifica intervalli numerici
  if (rules.numericRanges) {
    for (const [field, [min, max]] of Object.entries(rules.numericRanges)) {
      if (obj[field] !== undefined && typeof obj[field] === 'number') {
        if (obj[field] < min || obj[field] > max) {
          console.error(`Campo ${field} fuori dall'intervallo [${min}, ${max}]: ${obj[field]}`);
          return false;
        }
      }
    }
  }

  // Verifica valori enumerati
  if (rules.enums) {
    for (const [field, allowedValues] of Object.entries(rules.enums)) {
      if (obj[field] !== undefined && !allowedValues.includes(obj[field])) {
        console.error(
          `Valore non valido per ${field}: ${obj[field]}. Valori permessi: ${allowedValues.join(', ')}`
        );
        return false;
      }
    }
  }

  // Verifica regole per stringhe
  if (rules.stringRules) {
    for (const [field, rule] of Object.entries(rules.stringRules)) {
      if (obj[field] !== undefined && typeof obj[field] === 'string') {
        const value = obj[field] as string;

        if (rule.minLength !== undefined && value.length < rule.minLength) {
          console.error(
            `Campo ${field} troppo corto: ${value.length} caratteri (min: ${rule.minLength})`
          );
          return false;
        }

        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          console.error(
            `Campo ${field} troppo lungo: ${value.length} caratteri (max: ${rule.maxLength})`
          );
          return false;
        }

        if (rule.regex !== undefined && !rule.regex.test(value)) {
          console.error(`Campo ${field} non corrisponde al pattern richiesto: ${value}`);
          return false;
        }
      }
    }
  }

  return true;
}

// Registry centralizzato type-safe
const registry = new Map<LLMProviderId, LLMProviderHandler>();

// Provider di default
registry.set('openai', OpenAIProvider);
registry.set('jarvis', JarvisProvider);
registry.set('openrouter', OpenRouterProvider);

export function registerProvider(id: LLMProviderId, handler: LLMProviderHandler) {
  registry.set(id, handler);
}

export function getProvider(id: LLMProviderId): LLMProviderHandler {
  const provider = registry.get(id);
  if (!provider) {
    throw new Error(`[provider-registry] Provider non registrato: ${id}`);
  }
  return provider;
}

export function hasProvider(id: LLMProviderId): boolean {
  return registry.has(id);
}

export function listProviders(): LLMProviderId[] {
  return Array.from(registry.keys()) as LLMProviderId[];
}

export { registry };
