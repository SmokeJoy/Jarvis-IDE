/**
 * @file telemetry.types.ts
 * @description Definizioni per la telemetria
 */

export interface TelemetrySetting {
  enabled: boolean;
  level: 'basic' | 'detailed';
}

export interface TelemetryEvent {
  eventType: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata: Record<string, any>;
}

export interface ErrorEvent extends TelemetryEvent {
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface UsageEvent extends TelemetryEvent {
  feature: string;
  duration: number;
  success: boolean;
}
