/**
 * @file metrics.types.ts
 * @description Definizioni per le metriche
 */

export interface ProviderMetrics {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastResponseTime: number;
  errorRate: number;
  tokensUsed: number;
  cost: number;
}

export interface ProviderScore {
  providerId: string;
  score: number;
  factors: {
    reliability: number;
    performance: number;
    cost: number;
    availability: number;
  };
}

export interface TrackingEvent {
  eventType: string;
  timestamp: number;
  metadata: Record<string, any>;
}
