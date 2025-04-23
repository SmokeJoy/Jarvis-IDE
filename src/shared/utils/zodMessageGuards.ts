/**
 * @file zodMessageGuards.ts
 * @description Utilità per creare tipi e validatori per messaggi tramite Zod
 * @version 1.0.0
 */

import { z } from 'zod';
import logger from './outputLogger';

// Tipo di base per tutti i messaggi
export const baseMessageSchema = z.object({
  type: z.string(),
  payload: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.number().optional(),
  id: z.string().optional(),
  source: z.string().optional(),
});

export type BaseMessage = z.infer<typeof baseMessageSchema>;

/**
 * Crea un validatore per un messaggio specifico
 * @param type Tipo del messaggio
 * @param payloadSchema Schema Zod per il payload
 * @returns Validatore Zod per il messaggio
 */
export function createMessageValidator<T extends z.ZodTypeAny>(
  type: string,
  payloadSchema: T
) {
  return baseMessageSchema.extend({
    type: z.literal(type),
    payload: payloadSchema,
  });
}

/**
 * Crea un validatore per un messaggio di errore
 * @param type Tipo del messaggio
 * @returns Validatore Zod per il messaggio di errore
 */
export function createErrorMessageValidator(type: string) {
  return baseMessageSchema.extend({
    type: z.literal(type),
    error: z.string(),
  });
}

/**
 * Crea un validatore unione per un gruppo di messaggi
 * @param validators Array di validatori Zod
 * @returns Validatore Zod unione
 */
export function createUnionValidator(validators: z.ZodTypeAny[]) {
  return z.union(validators as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]);
}

/**
 * Tipo per le opzioni del validatore con guard
 */
export interface ValidatorGuardOptions {
  /** Se true, logga gli errori di validazione */
  logValidationErrors?: boolean;
  /** Prefisso personalizzato per i log */
  logPrefix?: string;
  /** Nome della categoria del messaggio per telemetria */
  messageCategory?: string;
  /** Se true, abilita statistiche di esecuzione */
  enableStats?: boolean;
}

const defaultValidatorOptions: ValidatorGuardOptions = {
  logValidationErrors: true,
  logPrefix: 'ValidationError',
  enableStats: false,
};

/**
 * Statistiche globali di validazione
 */
const validationStats: Record<string, {
  attempts: number;
  successes: number;
  failures: number;
  lastError?: string;
  lastErrorTimestamp?: number;
}> = {};

/**
 * Crea una funzione type guard tipizzata da uno schema Zod
 * @param schema Schema Zod per il validatore
 * @param options Opzioni per il validatore
 * @returns Funzione type guard
 */
export function createZodTypeGuard<T extends z.ZodType<any, any, any>>(
  schema: T,
  options?: ValidatorGuardOptions
): (data: unknown) => data is z.infer<T> {
  const opts = { ...defaultValidatorOptions, ...options };
  const category = opts.messageCategory || 'unknown';

  // Inizializza le statistiche se non esistono
  if (opts.enableStats && !validationStats[category]) {
    validationStats[category] = {
      attempts: 0,
      successes: 0,
      failures: 0,
    };
  }

  return (data: unknown): data is z.infer<T> => {
    // Incrementa contatore tentativi
    if (opts.enableStats) {
      validationStats[category].attempts++;
    }

    const result = schema.safeParse(data);
    
    if (result.success) {
      // Incrementa contatore successi
      if (opts.enableStats) {
        validationStats[category].successes++;
      }
      return true;
    }
    
    // Incrementa contatore fallimenti
    if (opts.enableStats) {
      validationStats[category].failures++;
      validationStats[category].lastError = result.error.message;
      validationStats[category].lastErrorTimestamp = Date.now();
    }

    // Log degli errori se abilitato
    if (opts.logValidationErrors) {
      const errorDetails = formatZodError(result.error);
      logger.warn(`${opts.logPrefix}: ${category} validation failed`, {
        errors: errorDetails,
        receivedData: truncateForLogging(data),
      });
    }

    return false;
  };
}

/**
 * Formatta gli errori Zod in una struttura più leggibile
 * @param error Errore Zod
 * @returns Errori formattati
 */
function formatZodError(error: z.ZodError): unknown {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Tronca i dati per il logging per evitare oggetti troppo grandi
 * @param data Dati da troncare
 * @returns Dati troncati
 */
function truncateForLogging(data: unknown): unknown {
  try {
    const str = JSON.stringify(data);
    if (str.length > 500) {
      return str.substring(0, 500) + '... [truncated]';
    }
    return data;
  } catch (e) {
    return `[Non serializzabile: ${typeof data}]`;
  }
}

/**
 * Restituisce le statistiche di validazione
 * @returns Copia delle statistiche
 */
export function getValidationStats(): typeof validationStats {
  return { ...validationStats };
}

/**
 * Resetta le statistiche di validazione
 * @param category Categoria specifica da resettare (opzionale)
 */
export function resetValidationStats(category?: string): void {
  if (category && validationStats[category]) {
    validationStats[category] = {
      attempts: 0,
      successes: 0,
      failures: 0,
    };
  } else if (!category) {
    Object.keys(validationStats).forEach(key => {
      validationStats[key] = {
        attempts: 0,
        successes: 0,
        failures: 0,
      };
    });
  }
}

/**
 * Crea uno schema per un messaggio di base con un payload specifico
 * @param messageType Tipo di messaggio
 * @param payloadSchema Schema per il payload (opzionale)
 * @returns Schema Zod
 */
export function createMessageSchema<T extends z.ZodTypeAny>(
  messageType: string,
  payloadSchema?: T
) {
  return baseMessageSchema.extend({
    type: z.literal(messageType),
    payload: payloadSchema || z.any().optional(),
  });
}

/**
 * Crea uno schema per un evento con payload tipizzato
 * @param eventType Tipo di evento
 * @param dataSchema Schema per i dati dell'evento
 * @returns Schema Zod
 */
export function createEventSchema<T extends z.ZodTypeAny>(
  eventType: string,
  dataSchema: T
) {
  return z.object({
    type: z.literal(eventType),
    data: dataSchema,
    timestamp: z.number().optional(),
  });
}

/**
 * Esempio di creazione di uno schema per un messaggio WebSocket
 */
export const pingMessageSchema = createMessageSchema('ping', z.object({
  timestamp: z.number()
}));

export type PingMessage = z.infer<typeof pingMessageSchema>;
export const isPingMessage = createZodTypeGuard(pingMessageSchema, {
  messageCategory: 'PingMessage',
  enableStats: true
});

/**
 * Esempio di creazione di uno schema per un evento
 */
export const connectionStatusEventSchema = createEventSchema('connectionStatus', z.object({
  connected: z.boolean(),
  lastPing: z.number().optional()
}));

export type ConnectionStatusEvent = z.infer<typeof connectionStatusEventSchema>;
export const isConnectionStatusEvent = createZodTypeGuard(connectionStatusEventSchema, {
  messageCategory: 'ConnectionStatusEvent'
}); 