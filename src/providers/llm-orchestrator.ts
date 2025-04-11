/**
 * @file llm-orchestrator.ts
 * @description Orchestratore per gestire le chiamate ai provider LLM
 * @version 2.0.0
 */

import { LLMProviderHandler, LLMRequestOptions, ProviderRegistry, getProvider, hasProvider, LLMProviderId } from './provider-registry';
import { logger } from '../utils/logger.js';

/**
 * Strategia di fallback per l'orchestratore
 */
export type FallbackStrategy = 'ordered' | 'random' | 'none';

/**
 * Opzioni di configurazione dell'orchestratore
 */
export interface OrchestratorOptions {
  /** Lista prioritaria di provider da utilizzare */
  preferredProviders?: LLMProviderId[];
  /** Provider predefinito da utilizzare */
  defaultProvider?: LLMProviderId;
  /** Strategia di fallback */
  fallbackStrategy?: FallbackStrategy;
  /** Numero massimo di tentativi con provider diversi */
  maxRetries?: number;
  /** Funzione per loggare eventi orchestratore */
  logger?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

/**
 * Risultato di una chiamata LLM
 */
export interface LLMCallResult {
  /** Contenuto della risposta */
  content: string;
  /** Provider utilizzato */
  provider: LLMProviderId;
  /** Modello utilizzato */
  model: string;
  /** Timestamp di inizio chiamata */
  startTime: number;
  /** Durata della chiamata in ms */
  duration: number;
  /** Tentativi effettuati */
  attempts: number;
}

/**
 * Stato della chiamata in corso
 */
interface CallState {
  /** Provider attualmente in uso */
  currentProvider: LLMProviderHandler;
  /** Provider ID attualmente in uso */
  currentProviderId: LLMProviderId;
  /** Tentativi effettuati */
  attempts: number;
  /** Provider già tentati */
  triedProviders: Set<LLMProviderId>;
  /** Orario di inizio chiamata */
  startTime: number;
  /** Errori incontrati */
  errors: Array<{ provider: LLMProviderId; error: Error }>;
}

/**
 * Elenco dei provider supportati di default
 */
const DEFAULT_SUPPORTED_PROVIDERS: LLMProviderId[] = [
  'openai',
  'openrouter',
  'ollama',
  'anthropic',
  'mistral',
  'google',
  'cohere'
];

/**
 * Provider di fallback predefinito
 */
const DEFAULT_FALLBACK_PROVIDER: LLMProviderId = 'openai';

/**
 * Orchestratore LLM
 * 
 * Gestisce le chiamate ai vari provider LLM registrati secondo una strategia
 * configurabile, con possibilità di fallback, retry e logging.
 */
export class LLMOrchestrator {
  private options: Required<OrchestratorOptions>;
  private availableProviders: LLMProviderId[] = [];
  
  /**
   * Costruttore dell'orchestratore
   * @param options Opzioni di configurazione
   */
  constructor(options?: OrchestratorOptions) {
    // Configurazione predefinita
    this.options = {
      preferredProviders: [],
      defaultProvider: DEFAULT_FALLBACK_PROVIDER,
      fallbackStrategy: 'ordered',
      maxRetries: 3,
      logger: this.defaultLogger,
      ...options
    };
    
    // Inizializza la lista dei provider disponibili
    this.refreshAvailableProviders();
  }
  
  /**
   * Logger predefinito che utilizza il logger di sistema
   * @param message Messaggio da loggare
   * @param level Livello di logging
   */
  private defaultLogger(message: string, level: 'info' | 'warn' | 'error'): void {
    switch (level) {
      case 'info':
        logger.info(`[LLMOrchestrator] ${message}`);
        break;
      case 'warn':
        logger.warn(`[LLMOrchestrator] ${message}`);
        break;
      case 'error':
        logger.error(`[LLMOrchestrator] ${message}`);
        break;
    }
  }
  
  /**
   * Aggiorna la configurazione dell'orchestratore
   * @param options Nuove opzioni
   */
  public updateOptions(options: Partial<OrchestratorOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
    
    this.refreshAvailableProviders();
  }
  
  /**
   * Verifica se un provider è ufficialmente supportato
   * @param providerId ID del provider da verificare
   * @returns true se il provider è supportato
   */
  private isProviderSupported(providerId: string): providerId is LLMProviderId {
    return DEFAULT_SUPPORTED_PROVIDERS.includes(providerId as LLMProviderId);
  }
  
  /**
   * Effettua una chiamata LLM utilizzando il provider più appropriato
   * @param options Opzioni della richiesta
   * @returns Promise con il risultato della chiamata
   */
  public async call(options: LLMRequestOptions): Promise<LLMCallResult> {
    const startTime = Date.now();
    
    // Inizializza lo stato della chiamata
    const state: CallState = {
      currentProvider: this.selectInitialProvider(options),
      currentProviderId: this.determineInitialProviderId(options),
      attempts: 0,
      triedProviders: new Set<LLMProviderId>(),
      startTime,
      errors: []
    };
    
    if (!state.currentProvider) {
      throw new Error('Nessun provider LLM disponibile per soddisfare la richiesta');
    }
    
    // Tentativo iniziale
    return this.attemptCall(options, state);
  }
  
  /**
   * Determina il provider ID iniziale per la richiesta
   * @param options Opzioni della richiesta
   * @returns Provider ID da utilizzare
   */
  private determineInitialProviderId(options: LLMRequestOptions): LLMProviderId {
    // Se un provider è specificato nelle opzioni, validalo
    if (options.providerParams?.provider && typeof options.providerParams.provider === 'string') {
      const requestedProviderId = options.providerParams.provider;
      
      // Verifica se il provider richiesto è supportato
      if (this.isProviderSupported(requestedProviderId)) {
        return requestedProviderId as LLMProviderId;
      } else {
        // Se non è supportato, logga un avviso
        this.log(`Provider richiesto "${requestedProviderId}" non è ufficialmente supportato, utilizzo fallback`, 'warn');
        
        // Se il provider esiste comunque nel registry, può essere usato
        if (hasProvider(requestedProviderId)) {
          this.log(`Provider "${requestedProviderId}" trovato nel registro ma non ufficialmente supportato, utilizzo con cautela`, 'warn');
          return requestedProviderId as LLMProviderId;
        }
        
        // Altrimenti usa il default
        return this.options.defaultProvider;
      }
    }
    
    // Altrimenti usa il provider predefinito
    return this.options.defaultProvider;
  }
  
  /**
   * Tenta una chiamata con il provider corrente, con retry se necessario
   * @param options Opzioni della richiesta
   * @param state Stato corrente della chiamata
   * @returns Promise con il risultato della chiamata
   */
  private async attemptCall(
    options: LLMRequestOptions, 
    state: CallState
  ): Promise<LLMCallResult> {
    state.attempts++;
    state.triedProviders.add(state.currentProviderId);
    
    try {
      this.log(`Tentativo #${state.attempts} con provider "${state.currentProviderId}"`, 'info');
      
      // Effettua la chiamata al provider corrente
      const model = options.model || 'default';
      const content = await state.currentProvider.call(options);
      const duration = Date.now() - state.startTime;
      
      this.log(`Completato con successo usando "${state.currentProviderId}"`, 'info');
      
      // Restituisci il risultato
      return {
        content,
        provider: state.currentProviderId,
        model,
        startTime: state.startTime,
        duration,
        attempts: state.attempts
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      this.log(`Errore con provider "${state.currentProviderId}": ${err.message}`, 'warn');
      
      // Registra l'errore
      state.errors.push({
        provider: state.currentProviderId,
        error: err
      });
      
      // Verifica se possiamo ritentare
      if (state.attempts < this.options.maxRetries) {
        const nextProvider = this.selectNextProvider(state);
        
        if (nextProvider) {
          state.currentProvider = nextProvider.handler;
          state.currentProviderId = nextProvider.id;
          return this.attemptCall(options, state);
        }
      }
      
      // Nessun altro provider disponibile o limite tentativi raggiunto
      throw this.createFinalError(state);
    }
  }
  
  /**
   * Seleziona il provider iniziale per la chiamata
   * @param options Opzioni della richiesta
   * @returns Provider selezionato
   */
  private selectInitialProvider(options: LLMRequestOptions): LLMProviderHandler {
    // Se un provider è specificato nelle opzioni, usalo se disponibile
    if (options.providerParams?.provider && typeof options.providerParams.provider === 'string') {
      const providerId = options.providerParams.provider;
      
      if (hasProvider(providerId)) {
        const provider = getProvider(providerId);
        
        if (provider.isAvailable) {
          return provider;
        } else {
          this.log(`Provider richiesto "${providerId}" non disponibile, fallback ad alternativa`, 'warn');
        }
      }
    }
    
    // Altrimenti usa il provider predefinito
    if (this.options.defaultProvider && hasProvider(this.options.defaultProvider)) {
      const provider = getProvider(this.options.defaultProvider);
      
      if (provider.isAvailable) {
        return provider;
      }
    }
    
    // Se nessuno disponibile, prendi il primo della lista preferiti
    for (const id of this.options.preferredProviders) {
      if (hasProvider(id)) {
        const provider = getProvider(id);
        
        if (provider.isAvailable) {
          return provider;
        }
      }
    }
    
    // Altrimenti prendi il primo disponibile
    for (const id of this.availableProviders) {
      const provider = getProvider(id);
      
      if (provider.isAvailable) {
        return provider;
      }
    }
    
    throw new Error('Nessun provider LLM disponibile');
  }
  
  /**
   * Seleziona il prossimo provider per retry in base alla strategia
   * @param state Stato corrente della chiamata
   * @returns Prossimo provider o null se non disponibile
   */
  private selectNextProvider(state: CallState): { handler: LLMProviderHandler, id: LLMProviderId } | null {
    // Se la strategia è "none", non effettuare retry
    if (this.options.fallbackStrategy === 'none') {
      return null;
    }
    
    // Lista di provider candidati (non ancora tentati)
    const candidates = this.availableProviders.filter(id => 
      !state.triedProviders.has(id) && 
      hasProvider(id) && 
      getProvider(id).isAvailable
    );
    
    if (candidates.length === 0) {
      return null;
    }
    
    let nextProviderId: LLMProviderId;
    
    // Seleziona il prossimo provider in base alla strategia
    if (this.options.fallbackStrategy === 'random') {
      // Strategia casuale
      const randomIndex = Math.floor(Math.random() * candidates.length);
      nextProviderId = candidates[randomIndex];
    } else {
      // Strategia ordinata (default)
      
      // Prima prova i preferiti che non sono stati ancora tentati
      for (const id of this.options.preferredProviders) {
        if (candidates.includes(id)) {
          nextProviderId = id;
          break;
        }
      }
      
      // Se nessun preferito disponibile, prendi il primo della lista
      if (!nextProviderId!) {
        nextProviderId = candidates[0];
      }
    }
    
    // Ottieni e restituisci il provider
    return { 
      handler: getProvider(nextProviderId!), 
      id: nextProviderId!
    };
  }
  
  /**
   * Crea un errore riassuntivo finale dopo tutti i tentativi
   * @param state Stato finale della chiamata
   * @returns Errore con dettagli sui tentativi
   */
  private createFinalError(state: CallState): Error {
    const providerErrors = state.errors.map(e => 
      `- ${e.provider}: ${e.error.message}`
    ).join('\n');
    
    return new Error(
      `Tutti i tentativi LLM falliti dopo ${state.attempts} tentativi:\n${providerErrors}`
    );
  }
  
  /**
   * Aggiorna la lista dei provider disponibili
   */
  public refreshAvailableProviders(): void {
    // Filtra solo i provider ufficialmente supportati
    const allRegisteredProviders = Array.from(ProviderRegistry.getAllProviders().keys()) as string[];
    
    // Dividi tra provider ufficiali e non ufficiali
    const officialProviders: LLMProviderId[] = [];
    const unofficialProviders: string[] = [];
    
    for (const id of allRegisteredProviders) {
      if (this.isProviderSupported(id)) {
        officialProviders.push(id as LLMProviderId);
      } else {
        unofficialProviders.push(id);
      }
    }
    
    // Aggiorna la lista dei provider disponibili (prima gli ufficiali, poi gli altri)
    this.availableProviders = [...officialProviders];
    
    // Log dei provider disponibili
    this.log(`Provider ufficiali disponibili: ${officialProviders.join(', ') || 'nessuno'}`, 'info');
    if (unofficialProviders.length > 0) {
      this.log(`Provider non ufficiali registrati: ${unofficialProviders.join(', ')}`, 'warn');
    }
    
    // Controllo se il provider predefinito è supportato
    if (this.options.defaultProvider && !this.isProviderSupported(this.options.defaultProvider)) {
      this.log(`ATTENZIONE: Il provider predefinito "${this.options.defaultProvider}" non è ufficialmente supportato`, 'error');
    }
  }
  
  /**
   * Logga un messaggio utilizzando la funzione di logging configurata
   * @param message Messaggio da loggare
   * @param level Livello di logging
   */
  private log(message: string, level: 'info' | 'warn' | 'error'): void {
    if (this.options.logger) {
      this.options.logger(`[LLMOrchestrator] ${message}`, level);
    }
  }
  
  /**
   * Verifica se un provider è disponibile
   * @param providerId ID del provider
   * @returns true se il provider è disponibile
   */
  public isProviderAvailable(providerId: LLMProviderId): boolean {
    if (!hasProvider(providerId)) {
      return false;
    }
    
    try {
      const provider = getProvider(providerId);
      return provider.isAvailable;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Ottiene la lista dei provider supportati ufficialmente
   * @returns Lista di provider supportati
   */
  public getSupportedProviders(): LLMProviderId[] {
    return [...DEFAULT_SUPPORTED_PROVIDERS];
  }
}

/**
 * Istanza predefinita dell'orchestratore LLM
 */
export const orchestrator = new LLMOrchestrator();

/**
 * Funzione helper per effettuare una chiamata LLM
 * @param options Opzioni della richiesta
 * @returns Promise con il risultato della chiamata
 */
export async function callLLM(options: LLMRequestOptions): Promise<LLMCallResult> {
  return orchestrator.call(options);
} 