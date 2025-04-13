/**
 * @file context.types.ts
 * @description Tipi per la gestione del contesto
 */

/**
 * Tipi di contesto supportati
 */
export type ContextType = 'text' | 'code' | 'image' | 'file';

/**
 * Metadata del contesto
 */
export interface ContextMetadata {
  timestamp?: number;
  source?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Dati del contesto
 */
export interface ContextData {
  id: string;
  content: string;
  type: ContextType;
  metadata?: ContextMetadata;
}

/**
 * Risultato della validazione del contesto
 */
export interface ContextValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}
