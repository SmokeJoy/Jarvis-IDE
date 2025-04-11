/**
 * @file provider-registry.ts
 * @description Registro centralizzato per i provider LLM
 * @version 1.0.0
 * 
 * Implementa un layer di astrazione per i provider LLM con supporto dinamico
 */

import { logger } from '../utils/logger.js';

/**
 * Identificatore univoco per un provider LLM
 * Elenco ufficiale dei provider supportati dall'orchestratore
 */
export type LLMProviderId = 'openai' | 'openrouter' | 'ollama' | 'anthropic' | 'mistral' | 'google' | 'cohere';

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
  stringRules?: Record<string, {
    minLength?: number;
    maxLength?: number;
    regex?: RegExp;
  }>;
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
export function validateObject(
  obj: Record<string, any>, 
  rules: ValidationRules
): boolean {
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
        console.error(`Valore non valido per ${field}: ${obj[field]}. Valori permessi: ${allowedValues.join(', ')}`);
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
          console.error(`Campo ${field} troppo corto: ${value.length} caratteri (min: ${rule.minLength})`);
          return false;
        }
        
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
          console.error(`Campo ${field} troppo lungo: ${value.length} caratteri (max: ${rule.maxLength})`);
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

/**
 * Classe che implementa il registry dei provider LLM
 */
export class LLMProviderRegistry {
  private static instance: LLMProviderRegistry = new LLMProviderRegistry();
  private providers: Map<LLMProviderId, LLMProviderHandler> = new Map();
  private defaultProviderId: LLMProviderId | null = null;

  private constructor() {
    // Singleton
  }

  /**
   * Registra un provider nel registry
   * @param id Identificatore del provider
   * @param handler Implementazione del provider
   * @param setAsDefault Imposta come provider predefinito
   * @returns true se il provider è stato registrato con successo
   */
  static registerProvider(
    id: LLMProviderId, 
    handler: LLMProviderHandler, 
    setAsDefault: boolean = false
  ): boolean {
    return LLMProviderRegistry.instance.registerProvider(id, handler, setAsDefault);
  }

  private registerProvider(
    id: LLMProviderId, 
    handler: LLMProviderHandler, 
    setAsDefault: boolean = false
  ): boolean {
    try {
      this.validateProviderHandler(id, handler);
      
      this.providers.set(id, handler);
      logger.info(`Provider LLM registrato: ${id} (${handler.name})`);
      
      // Imposta come default se è il primo o se richiesto
      if (setAsDefault || this.defaultProviderId === null) {
        this.defaultProviderId = id;
        logger.info(`Provider predefinito impostato: ${id}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Errore durante la registrazione del provider ${id}: ${error.message}`);
      return false;
    }
  }

  /**
   * Imposta un provider come predefinito
   * @param id Identificatore del provider
   */
  static setDefaultProvider(id: LLMProviderId): void {
    LLMProviderRegistry.instance.setDefaultProvider(id);
  }

  private setDefaultProvider(id: LLMProviderId): void {
    if (!this.providers.has(id)) {
      throw new Error(`Impossibile impostare provider default: ${id} non registrato`);
    }
    
    this.defaultProviderId = id;
    logger.info(`Provider predefinito impostato: ${id}`);
  }

  /**
   * Verifica se un provider è registrato
   * @param id Identificatore del provider
   * @returns true se il provider è registrato
   */
  static hasProvider(id: LLMProviderId): boolean {
    return LLMProviderRegistry.instance.hasProvider(id);
  }

  private hasProvider(id: LLMProviderId): boolean {
    return this.providers.has(id);
  }

  /**
   * Ottiene un provider dal registry
   * @param id Identificatore del provider
   * @returns Istanza del provider
   * @throws Error se il provider non è registrato
   */
  static getProvider(id: LLMProviderId): LLMProviderHandler {
    return LLMProviderRegistry.instance.getProvider(id);
  }

  private getProvider(id: LLMProviderId): LLMProviderHandler {
    if (!this.providers.has(id)) {
      throw new Error(`Provider LLM '${id}' non trovato nel registry`);
    }
    
    return this.providers.get(id)!;
  }

  /**
   * Ottiene il provider predefinito
   * @returns Provider predefinito
   * @throws Error se non è stato impostato un provider predefinito
   */
  static getDefaultProvider(): LLMProviderHandler {
    return LLMProviderRegistry.instance.getDefaultProvider();
  }

  private getDefaultProvider(): LLMProviderHandler {
    if (this.defaultProviderId === null) {
      throw new Error('Nessun provider LLM predefinito configurato');
    }
    
    return this.providers.get(this.defaultProviderId)!;
  }

  /**
   * Ottiene l'id del provider predefinito
   * @returns ID del provider predefinito o null se non impostato
   */
  static getDefaultProviderId(): LLMProviderId | null {
    return LLMProviderRegistry.instance.defaultProviderId;
  }

  /**
   * Rimuove un provider dal registry
   * @param id Identificatore del provider
   * @returns true se il provider è stato rimosso con successo
   */
  static unregisterProvider(id: LLMProviderId): boolean {
    return LLMProviderRegistry.instance.unregisterProvider(id);
  }

  private unregisterProvider(id: LLMProviderId): boolean {
    if (!this.providers.has(id)) {
      return false;
    }
    
    this.providers.delete(id);
    logger.info(`Provider LLM rimosso: ${id}`);
    
    // Resetta il provider default se è quello rimosso
    if (this.defaultProviderId === id) {
      this.defaultProviderId = null;
      logger.info('Provider predefinito resettato');
    }
    
    return true;
  }

  /**
   * Ottiene tutti i provider registrati
   * @returns Map con tutti i provider
   */
  static getAllProviders(): Map<LLMProviderId, LLMProviderHandler> {
    return new Map(LLMProviderRegistry.instance.providers);
  }

  /**
   * Ottiene gli ID di tutti i provider registrati
   * @returns Array di ID dei provider
   */
  static getProviderIds(): LLMProviderId[] {
    return Array.from(LLMProviderRegistry.instance.providers.keys());
  }

  /**
   * Ottiene solo i provider disponibili
   * @returns Map con i provider disponibili
   */
  static getAvailableProviders(): Map<LLMProviderId, LLMProviderHandler> {
    const available = new Map<LLMProviderId, LLMProviderHandler>();
    
    for (const [id, handler] of LLMProviderRegistry.instance.providers.entries()) {
      if (handler.isAvailable) {
        available.set(id, handler);
      }
    }
    
    return available;
  }

  /**
   * Valida un provider prima della registrazione
   * @param id ID del provider
   * @param handler Istanza del provider
   * @throws Error se il provider non è valido
   */
  private validateProviderHandler(id: LLMProviderId, handler: LLMProviderHandler): void {
    // Verifica proprietà obbligatorie
    if (!handler.name || handler.name.trim() === '') {
      throw new Error(`Provider ${id} invalido: proprietà 'name' mancante o vuota`);
    }
    
    // Verifica metodi obbligatori
    if (!handler.call || typeof handler.call !== 'function') {
      throw new Error(`Provider ${id} invalido: metodo 'call' mancante`);
    }
    
    if (!handler.getAvailableModels || typeof handler.getAvailableModels !== 'function') {
      throw new Error(`Provider ${id} invalido: metodo 'getAvailableModels' mancante`);
    }
    
    // Verifica metodi opzionali se presenti
    if (handler.validateRequest && typeof handler.validateRequest !== 'function') {
      throw new Error(`Provider ${id} invalido: metodo 'validateRequest' presente ma non è una funzione`);
    }
  }

  /**
   * Resetta il registry (utilizzato principalmente per i test)
   */
  static reset(): void {
    LLMProviderRegistry.instance.providers.clear();
    LLMProviderRegistry.instance.defaultProviderId = null;
    logger.debug('Provider registry resettato');
  }
}

// Esporta le funzioni helper per interagire con il registry
export const registerProvider = (
  id: LLMProviderId,
  handler: LLMProviderHandler,
  setAsDefault: boolean = false
): boolean => LLMProviderRegistry.registerProvider(id, handler, setAsDefault);

export const hasProvider = (id: LLMProviderId): boolean => LLMProviderRegistry.hasProvider(id);

export const getProvider = (id: LLMProviderId): LLMProviderHandler => LLMProviderRegistry.getProvider(id);

export const getDefaultProvider = (): LLMProviderHandler => LLMProviderRegistry.getDefaultProvider();

export const unregisterProvider = (id: LLMProviderId): boolean => LLMProviderRegistry.unregisterProvider(id); 