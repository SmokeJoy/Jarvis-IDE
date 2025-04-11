/**
 * @file provider-scoring.ts
 * @description Sistema di scoring e prioritizzazione automatica per provider LLM
 * @version 1.0.0
 */

import { LLMProviderId, LLMResponse, ProviderParams } from './provider-registry';

/**
 * Rappresenta un record di prestazioni per un singolo provider
 */
export interface ProviderPerformanceRecord {
  providerId: LLMProviderId;
  successRate: number;
  averageLatency: number; // in ms
  errorRate: number;
  tokenThroughput: number; // tokens al secondo
  lastUpdated: number; // timestamp
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  costEfficiency?: number; // costo per 1000 token, se disponibile
}

/**
 * Fattori di peso per il calcolo del punteggio complessivo
 */
export interface ScoringWeights {
  successRate: number;
  latency: number;
  errorRate: number;
  tokenThroughput: number;
  costEfficiency: number;
}

/**
 * Parametri di configurazione per l'auto-tuning
 */
export interface AutoTuningConfig {
  enabled: boolean;
  adaptationThreshold: number; // soglia di cambiamento score che attiva l'adattamento
  scoringWeights: ScoringWeights;
  scoringWindowSize: number; // numero di chiamate considerate per il calcolo
  minCallsBeforeScoring: number; // chiamate minime prima di attivare lo scoring
}

/**
 * Risultato di performance per un provider dopo una chiamata
 */
export interface ProviderCallResult {
  providerId: LLMProviderId;
  timestamp: number;
  success: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  error?: string;
  cost?: number;
}

/**
 * Gestisce lo scoring e la prioritizzazione dei provider LLM
 */
export class ProviderScoring {
  private performanceRecords: Map<LLMProviderId, ProviderPerformanceRecord> = new Map();
  private callHistory: Map<LLMProviderId, ProviderCallResult[]> = new Map();
  private providerPriorities: LLMProviderId[] = [];
  private config: AutoTuningConfig;
  
  /**
   * Default per i pesi di scoring
   */
  private static DEFAULT_WEIGHTS: ScoringWeights = {
    successRate: 0.40,
    latency: 0.20,
    errorRate: 0.15,
    tokenThroughput: 0.15,
    costEfficiency: 0.10
  };
  
  /**
   * Configurazione di default per l'auto-tuning
   */
  private static DEFAULT_CONFIG: AutoTuningConfig = {
    enabled: true,
    adaptationThreshold: 0.15, // 15% di cambiamento attiva l'adattamento
    scoringWeights: ProviderScoring.DEFAULT_WEIGHTS,
    scoringWindowSize: 20, // ultime 20 chiamate
    minCallsBeforeScoring: 5 // almeno 5 chiamate prima dello scoring
  };
  
  constructor(initialProviders: LLMProviderId[] = [], config?: Partial<AutoTuningConfig>) {
    this.config = { ...ProviderScoring.DEFAULT_CONFIG, ...config };
    this.providerPriorities = [...initialProviders];
    
    // Inizializza i record di performance per ogni provider
    initialProviders.forEach(providerId => {
      this.initializeProviderRecord(providerId);
    });
  }
  
  /**
   * Inizializza un record di performance per un provider
   */
  private initializeProviderRecord(providerId: LLMProviderId): void {
    if (!this.performanceRecords.has(providerId)) {
      this.performanceRecords.set(providerId, {
        providerId,
        successRate: 1.0, // Presupponiamo inizialmente un 100% di successo
        averageLatency: 0,
        errorRate: 0,
        tokenThroughput: 0,
        lastUpdated: Date.now(),
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0
      });
      
      this.callHistory.set(providerId, []);
    }
  }
  
  /**
   * Registra il risultato di una chiamata a un provider
   */
  public recordProviderCall(result: ProviderCallResult): void {
    const providerId = result.providerId;
    
    // Assicurati che il provider abbia un record
    if (!this.performanceRecords.has(providerId)) {
      this.initializeProviderRecord(providerId);
    }
    
    // Aggiungi il risultato alla cronologia
    const history = this.callHistory.get(providerId) || [];
    history.push(result);
    
    // Mantieni solo gli ultimi N risultati in base alla configurazione
    if (history.length > this.config.scoringWindowSize) {
      history.shift(); // Rimuovi il più vecchio
    }
    
    this.callHistory.set(providerId, history);
    
    // Aggiorna le metriche di performance
    this.updatePerformanceMetrics(providerId);
    
    // Se l'auto-tuning è abilitato, ricalcola le priorità
    if (this.config.enabled) {
      this.recalculateProviderPriorities();
    }
  }
  
  /**
   * Aggiorna le metriche di performance per un provider
   */
  private updatePerformanceMetrics(providerId: LLMProviderId): void {
    const history = this.callHistory.get(providerId) || [];
    const record = this.performanceRecords.get(providerId);
    
    if (!record || history.length === 0) return;
    
    // Calcola statistiche dalla cronologia
    const successfulCalls = history.filter(call => call.success).length;
    const successRate = history.length > 0 ? successfulCalls / history.length : 0;
    
    const totalLatency = history.reduce((sum, call) => sum + call.latencyMs, 0);
    const averageLatency = history.length > 0 ? totalLatency / history.length : 0;
    
    const totalInputTokens = history.reduce((sum, call) => sum + call.inputTokens, 0);
    const totalOutputTokens = history.reduce((sum, call) => sum + call.outputTokens, 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    
    const tokenThroughput = totalLatency > 0 ? (totalTokens / totalLatency) * 1000 : 0;
    
    // Aggiorna il record
    this.performanceRecords.set(providerId, {
      ...record,
      successRate,
      averageLatency,
      errorRate: 1 - successRate,
      tokenThroughput,
      lastUpdated: Date.now(),
      totalCalls: record.totalCalls + 1,
      successfulCalls: record.successfulCalls + (history[history.length - 1].success ? 1 : 0),
      failedCalls: record.failedCalls + (history[history.length - 1].success ? 0 : 1),
    });
  }
  
  /**
   * Calcola il punteggio totale di un provider
   */
  public calculateProviderScore(providerId: LLMProviderId): number {
    const record = this.performanceRecords.get(providerId);
    if (!record) return 0;
    
    // Se ci sono troppe poche chiamate, restituisci un punteggio neutro
    if (record.totalCalls < this.config.minCallsBeforeScoring) {
      return 0.5; // Punteggio neutro per provider con pochi dati
    }
    
    const weights = this.config.scoringWeights;
    
    // Normalizza la latenza (più bassa è meglio)
    // Usiamo una funzione sigmoidale per avere valori tra 0 e 1
    const normalizedLatency = 1 / (1 + Math.exp(record.averageLatency / 2000 - 2));
    
    // Calcola il punteggio usando i pesi configurati
    let score = 
      (weights.successRate * record.successRate) +
      (weights.latency * normalizedLatency) +
      (weights.errorRate * (1 - record.errorRate)) +
      (weights.tokenThroughput * Math.min(record.tokenThroughput / 50, 1)); // Normalizza a max 50 token/sec
    
    // Includi l'efficienza dei costi se disponibile
    if (record.costEfficiency !== undefined) {
      // Normalizza il costo (più basso è meglio)
      const normalizedCost = Math.max(0, 1 - (record.costEfficiency / 0.05)); // 0.05 = $0.05 per 1K token
      score += weights.costEfficiency * normalizedCost;
    }
    
    // Normalizza il punteggio finale
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Ricalcola le priorità dei provider in base ai punteggi attuali
   */
  private recalculateProviderPriorities(): void {
    // Calcola i punteggi attuali
    const scores = new Map<LLMProviderId, number>();
    
    // Conserva solo i provider che sono nell'elenco corrente delle priorità
    for (const providerId of this.providerPriorities) {
      scores.set(providerId, this.calculateProviderScore(providerId));
    }
    
    // Ordina i provider per punteggio decrescente
    const newPriorities = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([providerId]) => providerId);
    
    // Controlla se il cambiamento è significativo per attivare l'adattamento
    const isDifferentOrder = !this.areProviderPrioritiesEqual(this.providerPriorities, newPriorities);
    
    if (isDifferentOrder) {
      this.providerPriorities = newPriorities;
    }
  }
  
  /**
   * Verifica se due array di priorità sono uguali
   */
  private areProviderPrioritiesEqual(arr1: LLMProviderId[], arr2: LLMProviderId[]): boolean {
    if (arr1.length !== arr2.length) return false;
    
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    
    return true;
  }
  
  /**
   * Restituisce le priorità correnti dei provider
   */
  public getProviderPriorities(): LLMProviderId[] {
    return [...this.providerPriorities];
  }
  
  /**
   * Ottiene il record di performance di un provider
   */
  public getProviderPerformance(providerId: LLMProviderId): ProviderPerformanceRecord | undefined {
    return this.performanceRecords.get(providerId);
  }
  
  /**
   * Ottiene tutti i record di performance
   */
  public getAllProviderPerformances(): ProviderPerformanceRecord[] {
    return Array.from(this.performanceRecords.values());
  }
  
  /**
   * Aggiunge un nuovo provider al sistema di scoring
   */
  public addProvider(providerId: LLMProviderId): void {
    if (!this.providerPriorities.includes(providerId)) {
      this.providerPriorities.push(providerId);
      this.initializeProviderRecord(providerId);
    }
  }
  
  /**
   * Rimuove un provider dal sistema di scoring
   */
  public removeProvider(providerId: LLMProviderId): void {
    this.providerPriorities = this.providerPriorities.filter(id => id !== providerId);
    this.performanceRecords.delete(providerId);
    this.callHistory.delete(providerId);
  }
  
  /**
   * Aggiorna la configurazione dell'auto-tuning
   */
  public updateConfig(config: Partial<AutoTuningConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Ottiene la configurazione corrente
   */
  public getConfig(): AutoTuningConfig {
    return { ...this.config };
  }
  
  /**
   * Crea un risultato di chiamata dal response del provider
   */
  public static createCallResultFromResponse(
    providerId: LLMProviderId,
    response: LLMResponse | Error,
    startTime: number
  ): ProviderCallResult {
    const endTime = Date.now();
    const latencyMs = endTime - startTime;
    
    if (response instanceof Error) {
      return {
        providerId,
        timestamp: endTime,
        success: false,
        latencyMs,
        inputTokens: 0,
        outputTokens: 0,
        error: response.message
      };
    }
    
    return {
      providerId,
      timestamp: endTime,
      success: true,
      latencyMs,
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      cost: response.usage?.total_cost
    };
  }
} 