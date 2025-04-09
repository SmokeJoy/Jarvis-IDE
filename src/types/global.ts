/**
 * File di tipo globale per l'applicazione
 * Questo file esporta tutte le definizioni di tipo comuni utilizzate in tutto il progetto
 */

// Esporta i tipi dall'API centralizzata
export type {
  ApiConfiguration,
  OpenAiCompatibleModelInfo,
  LLMProviderId,
  ModelInfo,
  TelemetrySetting
} from '../shared/types/api.types.js.js';

// Esporta i tipi specifici da llm.types.js
export type {
  ChatCompletionContentPartText,
  ChatCompletionContentPartImage
} from '../shared/types/llm.types.js.js';

// Esporta i tipi dalle impostazioni della chat
export type { ChatSettings } from '../shared/types/user-settings.types.js.js';

// Esporta i tipi dalle impostazioni del browser
export type { BrowserSettings } from '../shared/types/user-settings.types.js.js';

// Esporta i tipi dalle impostazioni di approvazione automatica
export type { AutoApprovalSettings } from '../shared/types/user-settings.types.js.js';

// Re-esporta i tipi dal WebviewMessage centralizzato
export type {
  WebviewMessage,
  WebviewMessageBase
} from '../shared/types/webview.types.js.js';

/**
 * Enum per i livelli di log
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR"
}

// Definizioni di tipi comuni utilizzati nell'applicazione
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface HistoryItem {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  model?: string;
  provider?: string;
}

export interface Settings {
  apiKeys: ApiKey[];
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  language: string;
  history: HistoryItem[];
  recentFiles: string[];
  recentFolders: string[];
  useTelemetry: boolean;
}

/**
 * Tipi globali utilizzati in tutto il progetto
 */
export interface GlobalConfig {
  debug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxRetries: number;
  timeout: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface StreamConfig {
  bufferSize: number;
  chunkSize: number;
  timeout: number;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  cleanupInterval: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: number;
}

export interface SecurityContext {
  userId: string;
  permissions: string[];
  roles: string[];
  token?: string;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  wsUrl: string;
  features: FeatureFlags;
}

export interface VersionInfo {
  version: string;
  build: string;
  environment: string;
  timestamp: string;
}