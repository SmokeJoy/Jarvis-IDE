/**
 * @file llmOrchestrator.ts
 * @description Orchestratore LLM multi-provider con supporto fallback
 * @version 2.0.0
 */

import { WebSocketBridge } from '../utils/WebSocketBridge';
import { getProvider, getDefaultProvider, hasProvider, LLMProviderHandler, LLMProviderId } from '../../src/providers/provider-registry';

/**
 * Configurazione per il fallback tra provider
 */
export interface FallbackConfig {
  /** Se abilitare il fallback automatico */
  enabled: boolean;
  /** Provider ID da utilizzare come fallback */
  providerId?: LLMProviderId;
  /** Numero di tentativi prima di passare al fallback */
  maxRetries?: number;
  /** Timeout in ms prima di considerare fallito un tentativo */
  timeout?: number;
}

/**
 * Parametri per la richiesta LLM
 */
export interface LLMRequestParams {
  /** Input testuale per il modello */
  input: string;
  /** Contesto aggiuntivo per la richiesta */
  context?: Record<string, any>;
  /** Handler per lo streaming delle risposte */
  onStream?: (token: string, isComplete: boolean) => void;
  /** Signal per l'abort controller */
  signal?: AbortSignal;
  /** ID del provider da utilizzare */
  providerId?: LLMProviderId;
  /** ID del modello da utilizzare */
  modelId?: string;
  /** Configurazione per il fallback */
  fallback?: FallbackConfig;
}

/**
 * Stato di una richiesta LLM
 */
interface RequestState {
  id: string;
  params: LLMRequestParams;
  onStream?: (token: string, isComplete: boolean) => void;
  buffer: string;
  isComplete: boolean;
  provider: {
    id: LLMProviderId;
    handler: LLMProviderHandler;
  };
  retries: number;
  fallbackActivated: boolean;
}

/**
 * Orchestratore per le richieste LLM con supporto multi-provider
 */
class LLMOrchestrator {
  private webSocketBridge: WebSocketBridge;
  private activeRequests: Map<string, RequestState> = new Map();
  private fallbackConfig: FallbackConfig = {
    enabled: true,
    maxRetries: 2,
    timeout: 10000
  };

  constructor() {
    this.webSocketBridge = WebSocketBridge.getInstance();
    this.setupMessageListeners();
  }

  /**
   * Configura il fallback predefinito
   * @param config Configurazione per il fallback
   */
  setDefaultFallbackConfig(config: Partial<FallbackConfig>): void {
    this.fallbackConfig = {
      ...this.fallbackConfig,
      ...config
    };
    console.info('Configurazione fallback LLM aggiornata:', this.fallbackConfig);
  }

  /**
   * Configura i listener per i messaggi WebSocket
   */
  private setupMessageListeners(): void {
    // Listener per risposte LLM
    this.webSocketBridge.on('llm_response', (message) => {
      const { requestId, token, isComplete, error } = message;
      
      // Ignora messaggi senza requestId
      if (!requestId) {
        console.warn('Ricevuto messaggio LLM_RESPONSE senza requestId');
        return;
      }

      // Recupera lo stato della richiesta
      const request = this.activeRequests.get(requestId);
      if (!request) {
        console.warn(`Nessuna richiesta attiva trovata per requestId: ${requestId}`);
        return;
      }

      // Gestisci errori
      if (error) {
        console.error(`Errore nella risposta LLM per requestId ${requestId}:`, error);
        
        // Prova il fallback se configurato
        if (this.shouldAttemptFallback(request)) {
          this.activateFallback(request);
          return;
        }
        
        // Altrimenti notifica errore all'handler
        if (request.onStream) {
          request.onStream('', true);
        }
        
        // Rimuovi la richiesta
        this.activeRequests.delete(requestId);
        return;
      }

      // Aggiorna il buffer se il token è definito
      if (token) {
        request.buffer += token;
      }

      // Notifica al callback lo stream
      if (request.onStream) {
        request.onStream(token || '', isComplete);
      }

      // Se completo, rimuovi la richiesta
      if (isComplete) {
        this.activeRequests.delete(requestId);
      }
    });

    // Listener per errori
    this.webSocketBridge.on('WS_ERROR', (message) => {
      console.error('Errore nel messaggio WebSocket:', message.error);
      // Gestisci tutti i fallback attivi
      for (const [requestId, request] of this.activeRequests.entries()) {
        // Incrementa i tentativi
        request.retries++;
        // Prova il fallback se possibile
        if (this.shouldAttemptFallback(request)) {
          this.activateFallback(request);
        } else {
          // Altrimenti notifica errore all'handler
          if (request.onStream) {
            request.onStream('', true);
          }
          // Rimuovi la richiesta
          this.activeRequests.delete(requestId);
        }
      }
    });
  }

  /**
   * Determina se dovrebbe essere tentato il fallback per una richiesta
   * @param request La richiesta da valutare
   * @returns true se il fallback dovrebbe essere tentato
   */
  private shouldAttemptFallback(request: RequestState): boolean {
    // Verifica se il fallback è abilitato
    const fallbackConfig = request.params.fallback || this.fallbackConfig;
    if (!fallbackConfig.enabled) {
      return false;
    }

    // Verifica se sono stati superati i tentativi massimi
    if (request.retries >= (fallbackConfig.maxRetries || this.fallbackConfig.maxRetries)) {
      return false;
    }

    // Verifica se il fallback è già stato attivato
    if (request.fallbackActivated) {
      return false;
    }

    // Verifica che esista un provider di fallback o provider predefinito
    const fallbackProviderId = fallbackConfig.providerId || this.fallbackConfig.providerId;
    if (fallbackProviderId && !hasProvider(fallbackProviderId)) {
      return false;
    }

    // Se non è specificato un fallbackProviderId, verifica che ci sia un provider predefinito
    if (!fallbackProviderId && !this.fallbackConfig.providerId) {
      try {
        getDefaultProvider();
      } catch (e) {
        return false;
      }
    }

    return true;
  }

  /**
   * Attiva il fallback per una richiesta
   * @param request La richiesta per cui attivare il fallback
   */
  private activateFallback(request: RequestState): void {
    // Ottieni la configurazione di fallback
    const fallbackConfig = request.params.fallback || this.fallbackConfig;
    
    // Ottieni il provider di fallback
    let fallbackProvider: LLMProviderHandler;
    let fallbackProviderId: LLMProviderId;
    
    try {
      // Usa il provider specificato nella configurazione di fallback, oppure il provider predefinito
      if (fallbackConfig.providerId && hasProvider(fallbackConfig.providerId)) {
        fallbackProviderId = fallbackConfig.providerId;
        fallbackProvider = getProvider(fallbackProviderId);
      } else {
        fallbackProvider = getDefaultProvider();
        fallbackProviderId = 'default';
      }
    } catch (error) {
      console.error('Errore nell\'ottenere il provider di fallback:', error);
      
      // Notifica errore all'handler
      if (request.onStream) {
        request.onStream('', true);
      }
      
      // Rimuovi la richiesta
      this.activeRequests.delete(request.id);
      return;
    }

    // Aggiorna lo stato della richiesta
    request.provider = {
      id: fallbackProviderId,
      handler: fallbackProvider
    };
    request.fallbackActivated = true;
    
    console.info(`Attivato fallback per richiesta ${request.id}. Nuovo provider: ${fallbackProviderId}`);

    // Ri-esegui la richiesta con il nuovo provider
    this.executeRequestWithProvider(request);
  }

  /**
   * Esegue una richiesta con un provider specifico
   * @param request La richiesta da eseguire
   */
  private executeRequestWithProvider(request: RequestState): void {
    const { id, params, provider } = request;
    
    // Validazione della richiesta con il provider (se supporta validateRequest)
    if (provider.handler.validateRequest && !provider.handler.validateRequest(params)) {
      console.error(`Richiesta ${id} non valida per il provider ${provider.id}`);
      
      // Notifica errore all'handler
      if (request.onStream) {
        request.onStream('', true);
      }
      
      // Rimuovi la richiesta
      this.activeRequests.delete(id);
      return;
    }
    
    // Prepara il messaggio WebSocket
    const message = {
      type: "WS_LLM_REQUEST",
      input: params.input,
      context: params.context || {},
      requestId: id,
      providerId: provider.id,
      modelId: params.modelId
    };
    
    // Invia il messaggio
    this.webSocketBridge.sendLlmMessage(message);
    
    // Imposta un timeout per il fallback se configurato
    const fallbackConfig = params.fallback || this.fallbackConfig;
    if (fallbackConfig.timeout) {
      setTimeout(() => {
        // Verifica se la richiesta è ancora attiva
        if (this.activeRequests.has(id) && !request.isComplete) {
          console.warn(`Timeout per richiesta ${id} con provider ${provider.id}`);
          
          // Prova il fallback se possibile
          if (this.shouldAttemptFallback(request)) {
            this.activateFallback(request);
          }
        }
      }, fallbackConfig.timeout);
    }
  }

  /**
   * Genera un ID casuale per una richiesta
   * @returns ID richiesta
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Esegue una richiesta LLM
   * @param params Parametri della richiesta
   * @returns ID della richiesta
   */
  executeRequest(params: LLMRequestParams): string {
    // Verifica presenza dell'abort signal
    if (params.signal === undefined) {
      throw new Error('AbortController non configurato');
    }

    // Genera ID richiesta
    const requestId = this.generateRequestId();
    
    // Determina il provider da utilizzare
    let providerHandler: LLMProviderHandler;
    let providerId: LLMProviderId;
    
    try {
      // Se specificato, usa il provider richiesto
      if (params.providerId && hasProvider(params.providerId)) {
        providerId = params.providerId;
        providerHandler = getProvider(providerId);
      } else {
        // Altrimenti usa il provider predefinito
        providerHandler = getDefaultProvider();
        providerId = 'default';
      }
    } catch (error) {
      console.error('Errore nell\'ottenere il provider LLM:', error);
      throw new Error(`Provider LLM non disponibile: ${error.message}`);
    }
    
    // Crea lo stato della richiesta
    const requestState: RequestState = {
      id: requestId,
      params,
      onStream: params.onStream,
      buffer: '',
      isComplete: false,
      provider: {
        id: providerId,
        handler: providerHandler
      },
      retries: 0,
      fallbackActivated: false
    };
    
    // Registra la richiesta
    this.activeRequests.set(requestId, requestState);
    
    // Configura l'abort controller
    params.signal.addEventListener('abort', () => {
      // Verifica se la richiesta è ancora attiva
      if (this.activeRequests.has(requestId)) {
        console.info(`Annullamento richiesta ${requestId}`);
        
        // Invia messaggio di cancellazione
        this.webSocketBridge.sendLlmMessage({
          type: 'llm_cancel',
          requestId,
          payload: {}
        });
        
        // Rimuovi la richiesta
        this.activeRequests.delete(requestId);
      }
    });
    
    // Esegui la richiesta
    this.executeRequestWithProvider(requestState);
    
    return requestId;
  }

  /**
   * Controlla se una richiesta è ancora attiva
   * @param requestId ID della richiesta
   * @returns true se la richiesta è attiva
   */
  isRequestActive(requestId: string): boolean {
    return this.activeRequests.has(requestId);
  }

  /**
   * Ottiene lo stato attuale di una richiesta
   * @param requestId ID della richiesta
   * @returns Stato della richiesta o null se non trovata
   */
  getRequestState(requestId: string): Partial<RequestState> | null {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      return null;
    }
    
    // Restituisci una copia parziale dello stato senza handler sensibili
    return {
      id: request.id,
      buffer: request.buffer,
      isComplete: request.isComplete,
      retries: request.retries,
      fallbackActivated: request.fallbackActivated,
      provider: {
        id: request.provider.id,
        // Ometti l'handler
      }
    };
  }

  /**
   * Ottiene gli ID di tutte le richieste attive
   * @returns Array di ID richiesta
   */
  getActiveRequestIds(): string[] {
    return Array.from(this.activeRequests.keys());
  }
}

/**
 * Istanza singleton dell'orchestratore LLM
 */
export const llmOrchestrator = new LLMOrchestrator();