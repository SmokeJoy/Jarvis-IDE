/**
 * @file adaptive-conditions.ts
 * @description Condizioni predefinite per la strategia di fallback adattiva
 */

import { ProviderStats } from '../LLMFallbackManager';

/**
 * Tipo per le funzioni che valutano una condizione in base alle statistiche dei provider
 */
export type AdaptiveCondition = (stats: Map<string, ProviderStats>) => boolean;

/**
 * Crea una condizione che verifica se il tasso di fallimento medio supera una soglia
 * @param threshold Soglia percentuale di fallimento (0-100)
 * @returns Funzione condizione che restituisce true se il tasso di fallimento supera la soglia
 */
export const failureRateAbove = (threshold: number): AdaptiveCondition => {
  return (stats: Map<string, ProviderStats>) => {
    for (const providerStats of stats.values()) {
      const total = providerStats.successCount + providerStats.failureCount;
      if (total === 0) continue;
      
      const failureRate = (providerStats.failureCount / total) * 100;
      if (failureRate > threshold) return true;
    }
    return false;
  };
};

/**
 * Crea una condizione che verifica se il numero totale di fallimenti supera una soglia
 * @param count Numero di fallimenti da raggiungere
 * @returns Funzione condizione che restituisce true se i fallimenti superano la soglia
 */
export const totalFailuresAbove = (threshold: number): AdaptiveCondition => {
  return (stats: Map<string, ProviderStats>) => {
    for (const providerStats of stats.values()) {
      if (providerStats.failureCount > threshold) return true;
    }
    return false;
  };
};

/**
 * Crea una condizione che verifica se la latenza media di tutti i provider supera una soglia
 * @param ms Soglia di latenza in millisecondi
 * @returns Funzione condizione che restituisce true se la latenza media supera la soglia
 */
export const avgLatencyAbove = (threshold: number): AdaptiveCondition => {
  return (stats: Map<string, ProviderStats>) => {
    let totalLatency = 0;
    let count = 0;
    
    for (const providerStats of stats.values()) {
      if (providerStats.avgResponseTime > 0) {
        totalLatency += providerStats.avgResponseTime;
        count++;
      }
    }
    
    if (count === 0) return false;
    return (totalLatency / count) > threshold;
  };
};

/**
 * Crea una condizione che verifica se un provider specifico ha la latenza sopra una soglia
 * @param providerId ID del provider da monitorare
 * @param ms Soglia di latenza in millisecondi
 * @returns Funzione condizione che restituisce true se la latenza del provider supera la soglia
 */
export const providerLatencyAbove = (providerId: string, threshold: number): AdaptiveCondition => {
  return (stats: Map<string, ProviderStats>) => {
    const providerStats = stats.get(providerId);
    if (!providerStats) return false;
    return providerStats.avgResponseTime > threshold;
  };
};

/**
 * Crea una condizione che verifica se un provider specifico ha fallito recentemente
 * @param providerId ID del provider da monitorare
 * @param timeWindowMs Finestra temporale in millisecondi (default: 5 minuti)
 * @returns Funzione condizione che restituisce true se il provider ha fallito nell'intervallo di tempo
 */
export const providerFailedRecently = (providerId: string, timeWindowMs: number = 5 * 60 * 1000): AdaptiveCondition => {
  return (stats: Map<string, ProviderStats>) => {
    const providerStats = stats.get(providerId);
    if (!providerStats) return false;
    
    const now = Date.now();
    return providerStats.lastFailureTimestamp > 0 &&
           now - providerStats.lastFailureTimestamp < timeWindowMs;
  };
};

/**
 * Crea una condizione che verifica se siamo in un orario di picco predefinito
 * @param startHour Ora di inizio dell'orario di picco (0-23)
 * @param endHour Ora di fine dell'orario di picco (0-23)
 * @returns Funzione condizione che restituisce true se l'ora corrente è nell'intervallo specificato
 */
export const duringTimeWindow = (startHour: number, endHour: number): AdaptiveCondition => {
  if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
    throw new Error('Le ore devono essere comprese tra 0 e 23');
  }

  return () => {
    const currentHour = new Date().getHours();
    
    if (startHour <= endHour) {
      // Intervallo normale (es. 9-17)
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Intervallo a cavallo della mezzanotte (es. 22-6)
      return currentHour >= startHour || currentHour < endHour;
    }
  };
};

/**
 * Crea una condizione che combina più condizioni con un AND logico
 * @param conditions Array di condizioni da combinare
 * @returns Funzione condizione che restituisce true se tutte le condizioni sono true
 */
export const allConditions = (conditions: AdaptiveCondition[]): AdaptiveCondition => {
  if (!conditions || conditions.length === 0) {
    throw new Error('allConditions richiede almeno una condizione');
  }
  
  return (stats: Map<string, ProviderStats>) => {
    return conditions.every(condition => condition(stats));
  };
};

/**
 * Crea una condizione che combina più condizioni con un OR logico
 * @param conditions Array di condizioni da combinare
 * @returns Funzione condizione che restituisce true se almeno una condizione è true
 */
export const anyCondition = (conditions: AdaptiveCondition[]): AdaptiveCondition => {
  if (!conditions || conditions.length === 0) {
    throw new Error('anyCondition richiede almeno una condizione');
  }
  
  return (stats: Map<string, ProviderStats>) => {
    return conditions.some(condition => condition(stats));
  };
};

/**
 * Crea una condizione che nega il risultato di un'altra condizione
 * @param condition Condizione da negare
 * @returns Funzione condizione che restituisce true se la condizione originale è false
 */
export const notCondition = (condition: AdaptiveCondition): AdaptiveCondition => {
  if (!condition) {
    throw new Error('notCondition richiede una condizione da negare');
  }
  
  return (stats: Map<string, ProviderStats>) => {
    return !condition(stats);
  };
};

/**
 * Crea una condizione che verifica se il costo medio per token di un provider supera una soglia
 * @param providerId ID del provider da monitorare
 * @param costPerToken Soglia di costo per token
 * @returns Funzione condizione che restituisce true se il costo per token supera la soglia
 */
export const providerCostAbove = (providerId: string, costPerToken: number): AdaptiveCondition => {
  return (stats: Map<string, ProviderStats>) => {
    const providerStats = stats.get(providerId);
    if (!providerStats || !providerStats.costPerToken) return false;
    
    return providerStats.costPerToken >= costPerToken;
  };
}; 