/**
 * @file LLMEventBus.ts
 * @description Sistema di osservabilità per eventi relativi ai provider LLM
 */

/**
 * Tipi di eventi supportati dal sistema
 */
export type LLMEventName = 
  | 'provider:success'    // Emesso quando un provider ha eseguito con successo
  | 'provider:failure'    // Emesso quando un provider ha fallito
  | 'provider:fallback'   // Emesso quando viene selezionato un provider di fallback
  | 'provider:statsUpdated' // Emesso quando le statistiche vengono aggiornate
  | 'provider:cooldown';  // Emesso quando un provider è in cooldown dopo un fallimento

/**
 * Struttura standard di payload per gli eventi
 */
export interface LLMEventPayload {
  /** ID del provider coinvolto nell'evento */
  providerId: string;
  /** Timestamp dell'evento in millisecondi */
  timestamp: number;
  /** Dati aggiuntivi specifici dell'evento */
  [key: string]: any;
}

/**
 * Funzione di callback per gli eventi
 */
export type LLMEventListener = (payload: LLMEventPayload) => void;

/**
 * Bus degli eventi per la comunicazione e monitoraggio in tempo reale
 * degli eventi relativi ai provider LLM
 */
export class LLMEventBus {
  /** Mappa degli eventi e relativi listener */
  private listeners: Map<LLMEventName, Set<LLMEventListener>> = new Map();

  /**
   * Registra un listener per un determinato evento
   * @param eventName Nome dell'evento da monitorare
   * @param listener Funzione di callback da eseguire quando l'evento viene emesso
   * @returns Riferimento a this per supportare il method chaining
   */
  public on(eventName: LLMEventName, listener: LLMEventListener): this {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName)!.add(listener);
    return this;
  }

  /**
   * Rimuove un listener per un determinato evento
   * @param eventName Nome dell'evento
   * @param listener Funzione di callback da rimuovere
   * @returns Riferimento a this per supportare il method chaining
   */
  public off(eventName: LLMEventName, listener: LLMEventListener): this {
    const eventListeners = this.listeners.get(eventName);
    
    if (eventListeners) {
      eventListeners.delete(listener);
      
      // Se non ci sono più listener per questo evento, rimuovi la chiave
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
    
    return this;
  }

  /**
   * Emette un evento con relativo payload
   * @param eventName Nome dell'evento da emettere
   * @param payload Dati associati all'evento
   */
  public emit(eventName: LLMEventName, payload: Omit<LLMEventPayload, 'timestamp'>): void {
    const eventListeners = this.listeners.get(eventName);
    
    if (!eventListeners) return;
    
    // Aggiungi il timestamp se non presente
    const fullPayload: LLMEventPayload = {
      ...payload,
      timestamp: payload.timestamp || Date.now()
    };
    
    // Notifica tutti i listener registrati
    eventListeners.forEach(listener => {
      try {
        listener(fullPayload);
      } catch (error) {
        console.error(`Errore durante l'esecuzione del listener per l'evento ${eventName}:`, error);
      }
    });
  }

  /**
   * Rimuove tutti i listener per un determinato evento o per tutti gli eventi
   * @param eventName Nome dell'evento opzionale, se non specificato rimuove tutti i listener
   * @returns Riferimento a this per supportare il method chaining
   */
  public removeAllListeners(eventName?: LLMEventName): this {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
    
    return this;
  }

  /**
   * Ottiene il numero di listener registrati per un determinato evento
   * @param eventName Nome dell'evento
   * @returns Numero di listener registrati
   */
  public listenerCount(eventName: LLMEventName): number {
    const eventListeners = this.listeners.get(eventName);
    return eventListeners ? eventListeners.size : 0;
  }
} 