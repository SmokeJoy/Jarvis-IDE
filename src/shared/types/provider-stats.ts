import { LLMProviderId } from './llm-provider.types';

/**
 * Unified interface for provider statistics
 */
export interface ProviderStats {
  /** ID of the provider */
  providerId: LLMProviderId;
  /** Total number of requests */
  totalRequests: number;
  /** Number of successful requests */
  successCount: number;
  /** Number of failed requests */
  failureCount: number;
  /** Average response time in milliseconds */
  averageResponseTime: number;
  /** Success rate as a percentage (0-100) */
  successRate: number;
  /** Total cost incurred */
  totalCost: number;
  /** Whether the provider is in cooldown */
  isInCooldown: boolean;
  /** Timestamp when cooldown ends (null if not in cooldown) */
  cooldownEndTime: number | null;
  /** Last error message (null if no error) */
  lastError: string | null;
  /** Timestamp of last usage */
  lastUsed?: number;
  /** Cost per token (if applicable) */
  costPerToken?: number;
  /** Exponential Moving Average of response time */
  emaResponseTime: number;
  /** Simple Moving Average of success rate (0-1) */
  smaSuccessRate: number;
}
