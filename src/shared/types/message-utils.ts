import { z } from 'zod';
/**
 * @file message-utils.ts
 * @description Definizione del tipo base per tutti i messaggi del sistema
 * @version 2.0.0
 */

/**
 * Tipo base per tutti i messaggi con discriminante 'type'
 * @template T - Tipo discriminante (stringa letterale)
 * @template P - Tipo del payload
 */
export type BaseMessage<T extends string, P = undefined> = {
  type: T;
  payload: P;
  timestamp?: number;
  error?: string;
};

/**
 * Type guard generica per verificare se un messaggio è di un certo tipo
 * @param msg Messaggio da verificare
 * @param type Tipo atteso del messaggio
 * @returns true se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends string, P>(
  msg: unknown,
  type: T
): msg is BaseMessage<T, P> {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as any).type === type
  );
} 