import { z } from 'zod';
/**
 * Modulo per l'esportazione in formato CSV
 * @module utils/exporters/csv
 */

import { ChatMessage } from '../../shared/types';
import { ExportableSession } from './types';
import { Logger } from '../logger';

const logger = Logger.getInstance('csvExporter');

/**
 * Opzioni per la conversione in CSV
 */
export interface CSVOptions {
  /**
   * Separatore di campi da utilizzare
   * @default ','
   */
  separator?: string;

  /**
   * Se includere l'intestazione nel CSV
   * @default true
   */
  includeHeader?: boolean;

  /**
   * Campi da includere nel CSV
   * @default ['timestamp', 'role', 'content']
   */
  fields?: string[];

  /**
   * Formato della data/ora per il timestamp
   * @default 'ISO' per ISO 8601, 'locale' per formato locale, o una funzione personalizzata
   */
  timestampFormat?: 'ISO' | 'locale' | ((date: Date) => string);
}

/**
 * Formatta un valore per l'inclusione in CSV, gestendo virgolette e caratteri speciali
 *
 * @param value - Valore da formattare
 * @param separator - Separatore di campi
 * @returns Valore formattato per CSV
 */
function escapeCSV(value: any, separator: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Se il valore contiene virgolette, separatori o newline, racchiudilo in virgolette
  // e raddoppia le virgolette interne
  if (
    stringValue.includes('"') ||
    stringValue.includes(separator) ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converte un array di messaggi in formato CSV
 *
 * @param messages - Array di messaggi da esportare
 * @param options - Opzioni per il formato CSV
 * @returns Stringa contenente il CSV formattato
 */
export function toCSV(messages: ChatMessage[], options: CSVOptions = {}): string {
  try {
    logger.debug('Inizio esportazione in formato CSV');

    // Imposta opzioni predefinite
    const separator = options.separator || ',';
    const includeHeader = options.includeHeader !== false;
    const fields = options.fields || ['timestamp', 'role', 'content'];

    // Prepara la funzione per formattare il timestamp
    const formatTimestamp = (date: Date): string => {
      if (!options.timestampFormat || options.timestampFormat === 'ISO') {
        return date.toISOString();
      } else if (options.timestampFormat === 'locale') {
        return date.toLocaleString();
      } else if (typeof options.timestampFormat === 'function') {
        return options.timestampFormat(date);
      }
      return date.toISOString();
    };

    // Crea l'intestazione
    let csvContent = '';
    if (includeHeader) {
      csvContent = fields.map((field) => escapeCSV(field, separator)).join(separator) + '\n';
    }

    // Converti ogni messaggio in riga CSV
    for (const message of messages) {
      const row = fields
        .map((field) => {
          if (field === 'timestamp') {
            const date = message.timestamp ? new Date(message.timestamp) : new Date();
            return escapeCSV(formatTimestamp(date), separator);
          }

          // Gestisci campi nested con la notazione dot (es. 'user.name')
          if (field.includes('.')) {
            const parts = field.split('.');
            let value = message as any;
            for (const part of parts) {
              if (value === null || value === undefined) break;
              value = value[part];
            }
            return escapeCSV(value, separator);
          }

          return escapeCSV(message[field as keyof ChatMessage], separator);
        })
        .join(separator);

      csvContent += row + '\n';
    }

    logger.debug('Esportazione CSV completata con successo');
    return csvContent;
  } catch (error) {
    logger.error("Errore durante l'esportazione in formato CSV", { cause: error });
    throw new Error(
      `Errore durante l'esportazione in formato CSV: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Converte una sessione di chat in formato CSV
 * Estrae l'array di messaggi dalla sessione e lo converte in CSV
 *
 * @param session - Sessione da esportare
 * @param options - Opzioni per il formato CSV
 * @returns Stringa contenente il CSV formattato
 */
export function sessionToCSV(session: ExportableSession, options: CSVOptions = {}): string {
  // Verifica che ci siano messaggi da esportare
  if (!session.messages || session.messages.length === 0) {
    logger.warn('Nessun messaggio da esportare in CSV');
    return includeHeader(options);
  }

  return toCSV(session.messages, options);
}

/**
 * Restituisce solo l'intestazione CSV
 *
 * @param options - Opzioni per il formato CSV
 * @returns Stringa contenente l'intestazione CSV
 */
function includeHeader(options: CSVOptions = {}): string {
  const separator = options.separator || ',';
  const fields = options.fields || ['timestamp', 'role', 'content'];

  if (options.includeHeader !== false) {
    return fields.map((field) => escapeCSV(field, separator)).join(separator) + '\n';
  }

  return '';
}
