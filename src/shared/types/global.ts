/**
 * @file global.ts
 * @description Tipi globali dell'applicazione
 * @version 1.0.0
 */

import { ChatCompletionMessageParam } from '../../types/provider-types/openai-types';
import { ChatMessage } from './message.types';
import { BaseMessage } from './message.types';

// Importa i tipi da llm.types.ts
import { LLMProviderId } from './llm.types';

// Importa ApiConfiguration dalla definizione centrale
import { ApiConfiguration } from './api.types';

// Re-esporta i tipi necessari usando export type
export type { LLMProviderId, BaseMessage, ApiConfiguration };

// Esporta gli altri tipi dal file centralizzato
export type { ChatCompletionMessageParam };

// ChatCompletionContentPart è stato spostato in api.types.ts
export type { ChatCompletionContentPartText, ChatCompletionContentPartImage } from './api.types';

// Rimuovo la definizione duplicata di ApiConfiguration, che ora viene importata da api.types.js

// Definizione centralizzata per LogLevel
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface TelemetrySetting {
  enabled: boolean;
}

export interface JarvisSettings {
  apiConfiguration?: {
    provider: string;
    apiKey: string;
    modelId: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
  };
  telemetrySetting?: TelemetrySetting;
  customInstructions?: string;
  contextPrompt?: string | Record<string, unknown>;
  planActSeparateModelsSetting?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  message: string;
  error?: Error;
}
