import { LLMProvider } from './llm';

/**
 * Base interface for API responses
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Base interface for API requests
 */
export interface ApiRequest<T = unknown> {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: T;
  headers?: Record<string, string>;
}

/**
 * API error details
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Provider statistics
 */
export interface ProviderStats {
  successRate: number;
  averageLatency: number;
  totalCalls: number;
  errorRate: number;
  lastError?: string;
  lastErrorTimestamp?: number;
  cooldownUntil?: number;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  provider: LLMProvider;
  apiKey?: string;
  modelId?: string;
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
  priority: number;
  timeout?: number;
  retryCount?: number;
  cooldownDuration?: number;
}

/**
 * Provider health status
 */
export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'error' | 'cooldown';
  lastCheck: number;
  errorCount: number;
  averageLatency: number;
  successRate: number;
}

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
  provider?: LLMProvider;
  sessionId?: string;
}

/**
 * API metrics
 */
export interface ApiMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  p95Latency: number;
  successRate: number;
  timestamp: number;
} 