/**
 * Utility per la sanitizzazione dei dati per l'esportazione
 * @module utils/exporters/sanitize
 */

import { SanitizeOptions, ExportOptions } from './types.js';

/**
 * Opzioni per la sanitizzazione degli oggetti
 */
export interface SanitizeOptions {
  /** Se rimuovere i valori null dall'oggetto esportato */
  removeNull?: boolean;
  
  /** Se rimuovere i valori undefined dall'oggetto esportato */
  removeUndefined?: boolean;
  
  /** Profondità massima per la sanitizzazione dell'oggetto */
  maxDepth?: number;
  
  /** Lunghezza massima delle stringhe nell'output semplificato */
  maxStringLength?: number;
  
  /** Lunghezza massima degli array nell'output semplificato */
  maxArrayLength?: number;
}

/**
 * Opzioni di sanitizzazione predefinite
 */
export const DEFAULT_SANITIZE_OPTIONS: Required<SanitizeOptions> = {
  removeNull: false,
  removeUndefined: true,
  maxDepth: 5,
  maxStringLength: 100,
  maxArrayLength: 100,
};

/**
 * Sanitizza un oggetto per l'esportazione in base alle opzioni fornite
 * @param obj Oggetto da sanitizzare
 * @param options Opzioni di sanitizzazione
 * @returns Oggetto sanitizzato
 */
export function sanitizeExportObject(
  obj: any,
  options: SanitizeOptions = {},
  currentDepth = 0
): any {
  // Unisce le opzioni predefinite con quelle fornite
  const opts: Required<SanitizeOptions> = {
    ...DEFAULT_SANITIZE_OPTIONS,
    ...options,
  };

  // Gestione dei casi base
  if (obj === null) {
    return opts.removeNull ? undefined : null;
  }

  if (obj === undefined) {
    return undefined;
  }

  // Gestione dei tipi primitivi
  if (typeof obj === 'string') {
    if (obj.length > opts.maxStringLength) {
      return obj.substring(0, opts.maxStringLength) + '...';
    }
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Gestione delle date
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Controllo di profondità massima
  if (currentDepth >= opts.maxDepth) {
    if (Array.isArray(obj)) {
      return '[Array]';
    }
    return '[Oggetto]';
  }

  // Gestione degli array
  if (Array.isArray(obj)) {
    const sanitizedArray = obj
      .slice(0, opts.maxArrayLength)
      .map((item) => 
        sanitizeExportObject(item, options, currentDepth + 1)
      )
      .filter((item) => !(item === undefined && opts.removeUndefined));

    // Se l'array è stato troncato, aggiungiamo un messaggio
    if (obj.length > opts.maxArrayLength) {
      sanitizedArray.push(
        `... (${obj.length - opts.maxArrayLength} elementi omessi)`
      );
    }

    return sanitizedArray;
  }

  // Gestione degli oggetti generici
  const sanitizedObj: Record<string, any> = {};
  
  try {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = sanitizeExportObject(obj[key], options, currentDepth + 1);
        
        // Rimuove null e undefined in base alle opzioni
        if (value === null && opts.removeNull) continue;
        if (value === undefined && opts.removeUndefined) continue;
        
        sanitizedObj[key] = value;
      }
    }
    return sanitizedObj;
  } catch (error) {
    // In caso di errore durante l'iterazione, restituisci una rappresentazione semplificata
    return `[Oggetto non iterabile: ${error.message}]`;
  }
}

/**
 * Estrae le opzioni di sanitizzazione da ExportOptions
 */
export function extractSanitizeOptions(options?: Partial<ExportOptions>): SanitizeOptions {
  if (!options) return {};
  
  return {
    removeNull: options.removeNull,
    removeUndefined: options.removeUndefined,
    maxDepth: options.maxDepth,
    maxStringLength: options.maxStringLength,
    maxArrayLength: options.maxArrayLength
  };
}

/**
 * Semplifica un oggetto complesso per la stampa di log
 * Limita lunghezza stringhe e profondità oggetti
 * 
 * @param obj - Oggetto da semplificare
 * @returns Oggetto semplificato
 */
export function simplifyForLogging(obj: any): any {
  return sanitizeExportObject(obj, {
    maxDepth: 3,
    maxStringLength: 100,
    maxArrayLength: 10
  });
} 