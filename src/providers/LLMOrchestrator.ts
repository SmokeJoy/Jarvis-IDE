/**
 * @file LLMOrchestrator.ts
 * @description Orchestratore per gestire le chiamate ai provider LLM
 * @version 1.0.0
 */

import {
  ProviderRegistry,
  LLMProviderId,
  LLMProviderHandler,
  LLMRequestOptions,
} from './provider-registry';

/**
 * Opzioni per la configurazione dell'orchestratore
 */
export interface OrchestratorOptions {
  /** Tempo massimo di attesa in millisecondi prima di attivare il fallback */
  timeout?: number;
  /** Se true, registra metriche di performance per ogni provider */
  collectMetrics?: boolean;
  /** Se true, tenta di usare un provider alternativo in caso di errore */
  enableFallback?: boolean;
  /** Provider da utilizzare come fallback */
  fallbackProviderId?: LLMProviderId;
}

/**
 * Stato di una richiesta LLM
 */
export interface RequestState {
  /** ID univoco della richiesta */
  id: string;
  /** Provider utilizzato per la richiesta */
  providerId: LLMProviderId;
  /** Timestamp di inizio della richiesta */
  startTime: number;
  /** Parametri della richiesta */
  params: LLMRequestOptions;
  /** Stato di completamento */
  completed: boolean;
  /** Errore, se presente */
  error?: Error;
}

/**
 * Orchestratore per le richieste LLM
 * Gestisce la selezione del provider, fallback e monitoraggio
 */
export class LLMOrchestrator {
  private options: Required<OrchestratorOptions>;
  private activeRequests: Map<string, RequestState> = new Map();

  /**
   * Crea una nuova istanza dell'orchestratore
   * @param options Opzioni di configurazione
   */
  constructor(options: OrchestratorOptions = {}) {
    // Imposta opzioni di default
    this.options = {
      timeout: options.timeout ?? 30000, // 30 secondi default
      collectMetrics: options.collectMetrics ?? false,
      enableFallback: options.enableFallback ?? true,
      fallbackProviderId: options.fallbackProviderId ?? '',
    };

    console.log('LLMOrchestrator inizializzato con opzioni:', this.options);
  }

  /**
   * Esegue una richiesta LLM
   * @param params Parametri della richiesta
   * @param providerId Provider da utilizzare (opzionale)
   * @returns Promise con la risposta
   */
  async executeRequest(params: LLMRequestOptions, providerId?: LLMProviderId): Promise<string> {
    // Genera un ID univoco per la richiesta
    const requestId = this.generateRequestId();

    try {
      // Determina quale provider utilizzare
      const targetProviderId = providerId || this.determineProvider(params);

      console.log(`Esecuzione richiesta ${requestId} con provider ${targetProviderId}`);

      // Registra lo stato della richiesta
      this.activeRequests.set(requestId, {
        id: requestId,
        providerId: targetProviderId,
        startTime: Date.now(),
        params,
        completed: false,
      });

      // Ottiene il provider
      const provider = ProviderRegistry.getProvider(targetProviderId);

      // Validazione della richiesta
      if (!provider.validateRequest(params)) {
        throw new Error(`Parametri non validi per il provider ${targetProviderId}`);
      }

      // Esegue la chiamata con timeout
      const response = await this.executeWithTimeout(provider, params);

      // Aggiorna lo stato della richiesta
      this.activeRequests.set(requestId, {
        ...this.activeRequests.get(requestId)!,
        completed: true,
      });

      return response;
    } catch (error) {
      // Gestisce l'errore e attiva il fallback se necessario
      return this.handleRequestError(requestId, error as Error, params);
    }
  }

  /**
   * Esegue una richiesta con un timeout
   * @param provider Provider da utilizzare
   * @param params Parametri della richiesta
   * @returns Promise con la risposta
   */
  private async executeWithTimeout(
    provider: LLMProviderHandler,
    params: LLMRequestOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout dopo ${this.options.timeout}ms`));
      }, this.options.timeout);

      provider
        .call(params)
        .then((response) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Gestisce un errore durante una richiesta
   * @param requestId ID della richiesta
   * @param error Errore verificatosi
   * @param params Parametri originali della richiesta
   * @returns Promise con la risposta del fallback o rilancia l'errore
   */
  private async handleRequestError(
    requestId: string,
    error: Error,
    params: LLMRequestOptions
  ): Promise<string> {
    const requestState = this.activeRequests.get(requestId);

    if (!requestState) {
      throw error;
    }

    // Aggiorna lo stato della richiesta con l'errore
    this.activeRequests.set(requestId, {
      ...requestState,
      completed: true,
      error,
    });

    console.error(`Errore nella richiesta ${requestId}:`, error.message);

    // Se il fallback è abilitato e c'è un provider fallback disponibile
    if (this.options.enableFallback && this.canUseFallback(requestState.providerId)) {
      console.log(`Tentativo di fallback per richiesta ${requestId}`);
      return this.executeFallbackRequest(params, requestState.providerId);
    }

    // Rilancia l'errore se non è possibile utilizzare un fallback
    throw error;
  }

  /**
   * Esegue una richiesta di fallback
   * @param params Parametri della richiesta
   * @param failedProviderId ID del provider che ha fallito
   * @returns Promise con la risposta
   */
  private async executeFallbackRequest(
    params: LLMRequestOptions,
    failedProviderId: LLMProviderId
  ): Promise<string> {
    // Usa il provider fallback configurato o il primo provider disponibile
    const fallbackId =
      this.options.fallbackProviderId || this.getFirstAvailableProvider(failedProviderId);

    if (!fallbackId) {
      throw new Error('Nessun provider fallback disponibile');
    }

    console.log(`Usando provider fallback ${fallbackId}`);

    // Esegue la richiesta con il provider fallback
    const provider = ProviderRegistry.getProvider(fallbackId);
    return provider.call(params);
  }

  /**
   * Determina quale provider utilizzare in base ai parametri
   * @param params Parametri della richiesta
   * @returns ID del provider da utilizzare
   */
  private determineProvider(params: LLMRequestOptions): LLMProviderId {
    // Verifica se è specificato un provider nei parametri
    if (params.providerParams?.provider) {
      const requestedProvider = params.providerParams.provider;

      if (!ProviderRegistry.hasProvider(requestedProvider)) {
        console.warn(
          `Provider ${requestedProvider} non trovato nel registry - Attivazione fallback`
        );
        return this.options.fallbackProviderId || ProviderRegistry.getDefaultProvider().name;
      }
      return requestedProvider;
    }

    // Fallback al provider predefinito del registry
    try {
      return ProviderRegistry.getDefaultProvider().name;
    } catch (error) {
      throw new Error('Nessun provider LLM disponibile nel registry');
    }
  }

  /**
   * Verifica se è possibile utilizzare un fallback
   * @param currentProviderId ID del provider corrente
   * @returns true se è possibile utilizzare un fallback
   */
  private canUseFallback(currentProviderId: LLMProviderId): boolean {
    // Verifica se c'è un provider fallback configurato
    if (
      this.options.fallbackProviderId &&
      this.options.fallbackProviderId !== currentProviderId &&
      ProviderRegistry.hasProvider(this.options.fallbackProviderId)
    ) {
      return true;
    }

    // Verifica se c'è almeno un altro provider disponibile
    return this.getFirstAvailableProvider(currentProviderId) !== null;
  }

  /**
   * Ottiene il primo provider disponibile diverso da quello specificato
   * @param excludeProviderId ID del provider da escludere
   * @returns ID del primo provider disponibile o null
   */
  private getFirstAvailableProvider(excludeProviderId: LLMProviderId): LLMProviderId | null {
    const providers = ProviderRegistry.getAllProviders();

    for (const [id, provider] of providers) {
      if (id !== excludeProviderId) {
        return id;
      }
    }

    return null;
  }

  /**
   * Genera un ID univoco per una richiesta
   * @returns ID univoco
   */
  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Ottiene lo stato attuale delle richieste attive
   * @returns Mappa delle richieste attive
   */
  getActiveRequests(): Map<string, RequestState> {
    return new Map(this.activeRequests);
  }

  /**
   * Annulla una richiesta in corso
   * @param requestId ID della richiesta
   * @returns true se la richiesta è stata annullata
   */
  cancelRequest(requestId: string): boolean {
    // Implementazione base - il vero annullamento dipende dal provider specifico
    if (!this.activeRequests.has(requestId)) {
      return false;
    }

    const request = this.activeRequests.get(requestId)!;

    if (request.completed) {
      return false;
    }

    // Marca la richiesta come completata con un errore
    this.activeRequests.set(requestId, {
      ...request,
      completed: true,
      error: new Error('Richiesta annullata'),
    });

    console.log(`Richiesta ${requestId} annullata`);
    return true;
  }
}

// Esporta un'istanza singleton dell'orchestratore
export const orchestrator = new LLMOrchestrator();
