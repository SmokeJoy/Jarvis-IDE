/**
 * @file common.ts
 * @description Definizione centralizzata dei tipi comuni utilizzati nell'applicazione
 * @version 1.0.0
 */

/**
 * Interfaccia base per tutti i messaggi generici
 */
export interface BaseMessage {
  /** Tipo del messaggio */
  type: string;
  /** Payload opzionale del messaggio */
  payload?: Record<string, unknown>;
}

/**
 * Tipi di risposta dell'API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Struttura per errori dell'API
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Risultato di validazione generica
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Parametri di paginazione
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Risposta paginata generica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

/**
 * Metriche di performance
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: number;
}

/**
 * Funzione per type-guard generica
 */
export function isOfType<T>(value: any, property: keyof T): value is T {
  return value && typeof value === 'object' && property in value;
}

/**
 * Funzione per cast di tipo sicuro con error reporting
 * @param value Valore da convertire
 * @param typeName Nome del tipo (usato per debug)
 */
export function safeCast<T>(value: unknown, typeName: string): T | null {
  if (value === null || value === undefined) {
    console.warn(`[safeCast] Null or undefined value for ${typeName}`);
    return null;
  }
  
  return value as T;
} 