import { z } from 'zod';
/**
 * @file base-message.ts
 * @description Definizione del tipo base per tutti i messaggi del sistema
 */

/**
 * Tipo base per tutti i payload di messaggi
 * Estensibile per payload specifici
 */
export type BasePayload = Record<string, unknown>;

/**
 * Definizione generica del messaggio base che tutti i tipi di messaggi devono estendere
 * @template TType - Tipo discriminante del messaggio (stringa letterale)
 * @template TPayload - Struttura del payload del messaggio
 */
export interface BaseMessage<TType extends string, TPayload extends BasePayload = BasePayload> {
  /** Identificatore del tipo di messaggio (campo discriminante) */
  type: TType;
  
  /** Payload del messaggio, con struttura specifica per ogni tipo */
  payload: TPayload;
  
  /** Campo opzionale per gestione errori */
  error?: string;
  
  /** Timestamp di creazione del messaggio (opzionale) */
  timestamp?: number;
}

/**
 * Type guard base per verificare se un oggetto è conforme alla struttura BaseMessage
 */
export function isBaseMessage(message: unknown): message is BaseMessage<string, BasePayload> {
  return (
    typeof message === 'object' && 
    message !== null &&
    'type' in message &&
    typeof (message as any).type === 'string' &&
    'payload' in message &&
    typeof (message as any).payload === 'object'
  );
} 