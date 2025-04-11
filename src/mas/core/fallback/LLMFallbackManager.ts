/**
 * @file LLMFallbackManager.ts
 * @description Gestione del fallback tra provider LLM in caso di errori
 */

import type { LLMProviderHandler } from '../../providers/provider-registry-stub';
import { LLMEventBus } from './LLMEventBus';
import { 
  FallbackStrategy, 
  PreferredFallbackStrategy,
  FallbackStrategyFactory
} from './strategies';

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
  
  /**
   * Strategia di fallback da utilizzare (opzionale)
   * Se non specificata, viene utilizzata PreferredFallbackStrategy
   */
  strategy?: FallbackStrategy;
  
  /**
   * Tipo di strategia da utilizzare (opzionale)
   * Se specificato, sovrascrive 'strategy'
   * Valori possibili: 'preferred', 'roundRobin', 'reliability'
   */
  strategyType?: string;
  
  /**
   * Numero minimo di tentativi per considerare affidabile un provider
   * Usato solo nella strategia 'reliability'
   * @default 5
   */
  minimumAttempts?: number;
}

/**
 * Gestore del fallback tra provider LLM
 * Si occupa di eseguire le operazioni usando il provider ottimale
 * e di gestire i fallback in caso di errori
 */
export class LLMFallbackManager {
  private providers: LLMProviderHandler[];
  private rememberSuccessful: boolean;
  private maxRetries: number;
  private collectStats: boolean;
  private eventBus: LLMEventBus;
  private cooldownMs: number;
  private strategy: FallbackStrategy;
  
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
    
    // Inizializza la strategia, usando la factory se viene specificato un tipo di strategia
    if (options.strategyType) {
      this.strategy = FallbackStrategyFactory.create(options.strategyType, {
        preferredProvider: options.preferredProvider,
        rememberSuccessful: this.rememberSuccessful,
        minimumAttempts: options.minimumAttempts
      });
    } else {
      this.strategy = options.strategy || 
        new PreferredFallbackStrategy(options.preferredProvider || null, this.rememberSuccessful);
    }
    
    // Inizializza le statistiche per tutti i provider
    this.initializeStats();
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
    
    // Notifica la strategia del successo o fallimento
    if (success) {
      this.strategy.notifySuccess(providerId);
    } else {
      this.strategy.notifyFailure(providerId);
    }
  }

  /**
   * Imposta il provider preferito da usare come prima scelta
   * @param providerId ID del provider preferito
   */
  public setPreferredProvider(providerId: string): void {
    // Se stiamo usando una strategia PreferredFallbackStrategy, aggiorniamo la sua preferenza
    if (this.strategy instanceof PreferredFallbackStrategy) {
      this.strategy.setPreferredProvider(providerId);
    }
  }

  /**
   * Ottiene il provider attualmente preferito
   * @returns Il provider preferito o null se non impostato
   */
  public getPreferredProvider(): LLMProviderHandler | null {
    // Se stiamo usando una strategia PreferredFallbackStrategy, otteniamo il suo provider preferito
    if (this.strategy instanceof PreferredFallbackStrategy) {
      const preferredId = this.strategy.getPreferredProviderId();
      if (preferredId) {
        return this.providers.find(p => p.id === preferredId && p.isEnabled) || null;
      }
    }
    
    return null;
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
    
    // Set di provider già tentati e falliti in questa sequenza
    const failedProviders = new Set<string>();
    
    // Ottieni i provider in ordine secondo la strategia corrente
    const orderedProviders = this.strategy.getProvidersInOrder([...this.providers], this.stats);
    
    // Prova con ogni provider in ordine
    for (const provider of orderedProviders) {
      // Salta i provider disabilitati
      if (!provider.isEnabled) continue;
      
      // Verifica se il provider è in cooldown
      if (this.isProviderInCooldown(provider.id)) {
        // Emetti evento di cooldown
        this.eventBus.emit('provider:cooldown', {
          providerId: provider.id,
          cooldownUntil: this.stats.get(provider.id)!.lastFailureTimestamp + this.cooldownMs
        });
        continue; // Passa al prossimo provider
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
              isFallback: failedProviders.size > 0
            });
            
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
                isFallback: failedProviders.size > 0
              });
              
              throw error; // Rilancia l'errore all'ultimo tentativo
            }
            // Altrimenti continua con il prossimo tentativo
          }
        }
      } catch (error) {
        console.error(`Provider ${provider.id} fallito:`, error);
        errors.push(error as Error);
        
        // Aggiungi questo provider al set dei falliti
        failedProviders.add(provider.id);
        
        // Trova un provider precedente non fallito per l'evento di fallback
        const lastNonFailedProvider = orderedProviders
          .filter(p => !failedProviders.has(p.id))
          .find(p => true);
        
        // Emetti evento di fallback se c'è un provider successivo
        const nextProvider = orderedProviders.find(p => 
          p.isEnabled && !failedProviders.has(p.id) && !this.isProviderInCooldown(p.id)
        );
        
        if (nextProvider) {
          this.eventBus.emit('provider:fallback', {
            providerId: nextProvider.id,
            fromProviderId: provider.id,
            reason: 'fallimento provider precedente'
          });
        }
        
        // Continua con il prossimo provider
      }
    }

    // Se arriviamo qui, tutti i provider hanno fallito
    const errorDetails = errors.map(e => e.message).join('; ');
    throw new Error(`Tutti i provider LLM hanno fallito: ${errorDetails}`);
  }
  
  /**
   * Imposta la strategia di fallback da utilizzare
   * @param strategy Nuova strategia da utilizzare
   */
  public setStrategy(strategy: FallbackStrategy): void {
    this.strategy = strategy;
  }
  
  /**
   * Ottiene la strategia di fallback correntemente in uso
   * @returns Strategia corrente
   */
  public getStrategy(): FallbackStrategy {
    return this.strategy;
  }
} 