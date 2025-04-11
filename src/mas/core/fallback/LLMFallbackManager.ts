/**
 * @file LLMFallbackManager.ts
 * @description Gestione del fallback tra provider LLM in caso di errori
 */

import type { LLMProviderHandler } from '../../providers/provider-registry-stub';
import { LLMEventBus } from './LLMEventBus';

/**
 * Interfaccia per le statistiche di un provider
 */
export interface ProviderStats {
  /** ID del provider */
  providerId: string;
  /** Numero di richieste eseguite con successo */
  successCount: number;
  /** Numero di richieste fallite */
  failureCount: number;
  /** Tasso di successo (percentuale) */
  successRate: number;
  /** Tempo medio di risposta in ms */
  avgResponseTime: number;
  /** Timestamp dell'ultimo utilizzo */
  lastUsed: number;
  /** Timestamp dell'ultimo fallimento (ms) */
  lastFailureTimestamp: number;
}

/**
 * Opzioni per configurare il manager di fallback
 */
export interface LLMFallbackOptions {
  /**
   * Array di provider disponibili per il fallback
   */
  providers: LLMProviderHandler[];
  
  /**
   * Provider preferito da usare come prima scelta (opzionale)
   */
  preferredProvider?: string;
  
  /**
   * Se true, memorizza l'ultimo provider che ha avuto successo per usarlo come preferito
   * @default true
   */
  rememberSuccessful?: boolean;
  
  /**
   * Numero massimo di tentativi per provider
   * @default 1
   */
  maxRetries?: number;
  
  /**
   * Se true, raccoglie statistiche sull'utilizzo dei provider
   * @default true
   */
  collectStats?: boolean;
  
  /**
   * Event bus per notificare gli eventi (opzionale)
   * Se non specificato, viene creato un nuovo event bus
   */
  eventBus?: LLMEventBus;

  /**
   * Tempo di cooldown in millisecondi dopo un fallimento
   * Durante questo periodo, il provider non verrà utilizzato
   * @default 60000 (1 minuto)
   */
  cooldownMs?: number;
}

/**
 * Gestore del fallback tra provider LLM
 * Si occupa di eseguire le operazioni usando il provider ottimale
 * e di gestire i fallback in caso di errori
 */
export class LLMFallbackManager {
  private providers: LLMProviderHandler[];
  private lastSuccessfulProvider: LLMProviderHandler | null = null;
  private preferredProviderId: string | null = null;
  private rememberSuccessful: boolean;
  private maxRetries: number;
  private collectStats: boolean;
  private eventBus: LLMEventBus;
  private cooldownMs: number;
  
  // Statistiche per provider
  private stats: Map<string, ProviderStats> = new Map();

  /**
   * Inizializza un nuovo manager di fallback per i provider LLM
   * @param options Opzioni di configurazione
   */
  constructor(options: LLMFallbackOptions) {
    this.providers = [...options.providers]; // Copia l'array per evitare modifiche esterne
    this.rememberSuccessful = options.rememberSuccessful !== false; // True di default
    this.maxRetries = options.maxRetries || 1;
    this.collectStats = options.collectStats !== false; // True di default
    this.eventBus = options.eventBus || new LLMEventBus(); // Usa l'event bus fornito o ne crea uno nuovo
    this.cooldownMs = options.cooldownMs || 60_000; // 1 minuto di default
    
    // Inizializza le statistiche per tutti i provider
    this.initializeStats();
    
    // Imposta il provider preferito iniziale se specificato
    if (options.preferredProvider) {
      this.setPreferredProvider(options.preferredProvider);
    }
  }

  /**
   * Inizializza le statistiche per tutti i provider
   */
  private initializeStats(): void {
    if (!this.collectStats) return;
    
    this.providers.forEach(provider => {
      this.stats.set(provider.id, {
        providerId: provider.id,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgResponseTime: 0,
        lastUsed: 0,
        lastFailureTimestamp: 0
      });
    });
  }

  /**
   * Ottiene l'event bus utilizzato dal manager
   * @returns L'istanza di LLMEventBus
   */
  public getEventBus(): LLMEventBus {
    return this.eventBus;
  }

  /**
   * Registra un tentativo di utilizzo di un provider
   * @param providerId ID del provider
   * @param success Se il tentativo ha avuto successo
   * @param responseTime Tempo di risposta in ms
   */
  private recordAttempt(providerId: string, success: boolean, responseTime: number): void {
    if (!this.collectStats) return;
    
    const providerStats = this.stats.get(providerId);
    if (!providerStats) return;
    
    if (success) {
      providerStats.successCount++;
    } else {
      providerStats.failureCount++;
      providerStats.lastFailureTimestamp = Date.now();
    }
    
    const totalAttempts = providerStats.successCount + providerStats.failureCount;
    providerStats.successRate = totalAttempts > 0 
      ? (providerStats.successCount / totalAttempts) * 100 
      : 0;
    
    // Aggiorna il tempo medio di risposta
    if (success) {
      const totalTime = providerStats.avgResponseTime * (providerStats.successCount - 1);
      providerStats.avgResponseTime = (totalTime + responseTime) / providerStats.successCount;
    }
    
    providerStats.lastUsed = Date.now();
    
    // Aggiorna la mappa delle statistiche
    this.stats.set(providerId, providerStats);
    
    // Emetti evento di aggiornamento statistiche
    this.eventBus.emit('provider:statsUpdated', {
      providerId,
      stats: { ...providerStats },
      success
    });
  }

  /**
   * Imposta il provider preferito da usare come prima scelta
   * @param providerId ID del provider preferito
   */
  public setPreferredProvider(providerId: string): void {
    this.preferredProviderId = providerId;
    
    // Cerca il provider nell'elenco dei provider disponibili
    const preferredProvider = this.providers.find(p => p.id === providerId);
    if (preferredProvider && preferredProvider.isEnabled) {
      this.lastSuccessfulProvider = preferredProvider;
    }
  }

  /**
   * Ottiene il provider attualmente preferito
   * @returns Il provider preferito o null se non impostato
   */
  public getPreferredProvider(): LLMProviderHandler | null {
    return this.lastSuccessfulProvider;
  }

  /**
   * Aggiunge un nuovo provider all'elenco
   * @param provider Provider da aggiungere
   */
  public addProvider(provider: LLMProviderHandler): void {
    // Verifica che il provider non sia già presente
    if (!this.providers.some(p => p.id === provider.id)) {
      this.providers.push(provider);
      
      // Inizializza le statistiche per il nuovo provider
      if (this.collectStats) {
        this.stats.set(provider.id, {
          providerId: provider.id,
          successCount: 0,
          failureCount: 0,
          successRate: 0,
          avgResponseTime: 0,
          lastUsed: 0,
          lastFailureTimestamp: 0
        });
      }
    }
  }

  /**
   * Rimuove un provider dall'elenco
   * @param providerId ID del provider da rimuovere
   */
  public removeProvider(providerId: string): void {
    this.providers = this.providers.filter(p => p.id !== providerId);
    
    // Rimuovi le statistiche per questo provider
    if (this.collectStats) {
      this.stats.delete(providerId);
    }
    
    // Se il provider rimosso era quello preferito, resetta lo stato
    if (this.lastSuccessfulProvider?.id === providerId) {
      this.lastSuccessfulProvider = null;
    }
    
    if (this.preferredProviderId === providerId) {
      this.preferredProviderId = null;
    }
  }

  /**
   * Ottiene l'elenco di tutti i provider disponibili
   * @returns Array di provider
   */
  public getProviders(): LLMProviderHandler[] {
    return [...this.providers];
  }

  /**
   * Ottiene le statistiche di tutti i provider
   * @returns Mappa di statistiche per provider
   */
  public getAllStats(): Map<string, ProviderStats> {
    return new Map(this.stats);
  }

  /**
   * Ottiene le statistiche di un provider specifico
   * @param providerId ID del provider
   * @returns Statistiche del provider o null se non trovato
   */
  public getProviderStats(providerId: string): ProviderStats | null {
    return this.stats.get(providerId) || null;
  }

  /**
   * Ottiene l'elenco di provider ordinati per tasso di successo
   * @returns Array di provider ordinati dal più affidabile al meno affidabile
   */
  public getProvidersByReliability(): LLMProviderHandler[] {
    if (!this.collectStats) return [...this.providers];
    
    // Crea una mappa temporanea di id provider -> tasso di successo
    const successRates = new Map<string, number>();
    this.stats.forEach((stats, providerId) => {
      successRates.set(providerId, stats.successRate);
    });
    
    // Ordina i provider per tasso di successo decrescente
    return [...this.providers].sort((a, b) => {
      const rateA = successRates.get(a.id) || 0;
      const rateB = successRates.get(b.id) || 0;
      return rateB - rateA;
    });
  }

  /**
   * Verifica se un provider è in cooldown
   * @param providerId ID del provider da verificare
   * @returns true se il provider è in cooldown, false altrimenti
   */
  public isProviderInCooldown(providerId: string): boolean {
    if (!this.collectStats) return false;
    
    const providerStats = this.stats.get(providerId);
    if (!providerStats || providerStats.lastFailureTimestamp === 0) return false;
    
    const now = Date.now();
    return (now - providerStats.lastFailureTimestamp) < this.cooldownMs;
  }

  /**
   * Esegue un'operazione usando il provider ottimale con fallback automatico
   * @param callback Funzione da eseguire con un provider
   * @returns Risultato dell'operazione
   * @throws Error se tutti i provider falliscono
   */
  public async executeWithFallback<T>(callback: (provider: LLMProviderHandler) => Promise<T>): Promise<T> {
    // Array di errori per eventuale diagnostica
    const errors: Error[] = [];
    
    // Prima prova con il provider preferito se esiste
    if (this.lastSuccessfulProvider) {
      // Verifica se il provider preferito è in cooldown
      if (this.isProviderInCooldown(this.lastSuccessfulProvider.id)) {
        // Emetti evento di cooldown
        this.eventBus.emit('provider:cooldown', {
          providerId: this.lastSuccessfulProvider.id,
          cooldownUntil: this.stats.get(this.lastSuccessfulProvider.id)!.lastFailureTimestamp + this.cooldownMs
        });
      } else {
        try {
          // Esegui più tentativi se configurato
          for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
              const startTime = Date.now();
              const result = await callback(this.lastSuccessfulProvider);
              const responseTime = Date.now() - startTime;
              
              // Registra il successo nelle statistiche
              this.recordAttempt(this.lastSuccessfulProvider.id, true, responseTime);
              
              // Emetti evento di successo
              this.eventBus.emit('provider:success', {
                providerId: this.lastSuccessfulProvider.id,
                responseTime,
                attempt
              });
              
              return result;
            } catch (error) {
              if (attempt === this.maxRetries - 1) {
                // Registra il fallimento nelle statistiche
                this.recordAttempt(this.lastSuccessfulProvider.id, false, 0);
                
                // Emetti evento di fallimento
                this.eventBus.emit('provider:failure', {
                  providerId: this.lastSuccessfulProvider.id,
                  error: error as Error,
                  attempts: attempt + 1
                });
                
                throw error; // Rilancia l'errore all'ultimo tentativo
              }
              // Altrimenti continua con il prossimo tentativo
            }
          }
        } catch (error) {
          console.error(`Il provider preferito ${this.lastSuccessfulProvider.id} ha fallito:`, error);
          errors.push(error as Error);
          
          // Se arriviamo qui, il provider preferito ha fallito e dobbiamo fare fallback
          // Memorizziamo il provider fallito per riferimento
          const failedProviderId = this.lastSuccessfulProvider.id;
          
          // Continua con il fallback
        }
      }
    }

    // Filtra i provider disponibili ed esclude quello già tentato
    const availableProviders = this.providers.filter(
      p => p.isEnabled && p.id !== this.lastSuccessfulProvider?.id
    );
    
    // Se non ci sono provider disponibili, lancia un errore
    if (availableProviders.length === 0) {
      throw new Error('Nessun provider LLM disponibile');
    }

    // Prova con ogni provider disponibile
    for (const provider of availableProviders) {
      // Verifica se il provider è in cooldown
      if (this.isProviderInCooldown(provider.id)) {
        // Emetti evento di cooldown
        this.eventBus.emit('provider:cooldown', {
          providerId: provider.id,
          cooldownUntil: this.stats.get(provider.id)!.lastFailureTimestamp + this.cooldownMs
        });
        // Salta al prossimo provider
        continue;
      }
      
      // Emetti evento di fallback quando passiamo a un altro provider
      if (this.lastSuccessfulProvider) {
        this.eventBus.emit('provider:fallback', {
          providerId: provider.id,
          fromProviderId: this.lastSuccessfulProvider.id,
          reason: 'fallimento provider precedente'
        });
      }
      
      try {
        // Esegui più tentativi se configurato
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
          try {
            const startTime = Date.now();
            const result = await callback(provider);
            const responseTime = Date.now() - startTime;
            
            // Registra il successo nelle statistiche
            this.recordAttempt(provider.id, true, responseTime);
            
            // Emetti evento di successo
            this.eventBus.emit('provider:success', {
              providerId: provider.id,
              responseTime,
              attempt,
              isFallback: true
            });
            
            // Memorizza questo provider come ultimo con successo se l'opzione è attiva
            if (this.rememberSuccessful) {
              this.lastSuccessfulProvider = provider;
            }
            
            return result;
          } catch (error) {
            if (attempt === this.maxRetries - 1) {
              // Registra il fallimento nelle statistiche
              this.recordAttempt(provider.id, false, 0);
              
              // Emetti evento di fallimento
              this.eventBus.emit('provider:failure', {
                providerId: provider.id,
                error: error as Error,
                attempts: attempt + 1,
                isFallback: true
              });
              
              throw error; // Rilancia l'errore all'ultimo tentativo
            }
            // Altrimenti continua con il prossimo tentativo
          }
        }
      } catch (error) {
        console.error(`Provider ${provider.id} fallito:`, error);
        errors.push(error as Error);
        // Continua con il prossimo provider
      }
    }

    // Se arriviamo qui, tutti i provider hanno fallito
    const errorDetails = errors.map(e => e.message).join('; ');
    throw new Error(`Tutti i provider LLM hanno fallito: ${errorDetails}`);
  }
} 