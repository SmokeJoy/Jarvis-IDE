/**
 * Modulo principale per l'esportazione di sessioni di chat
 * @module utils/exporters
 */

import { toJSON, toYAML } from './serializers.js';
import { toMarkdown } from './markdown.js';
import { sessionToCSV } from './csv.js';
import { toHTML } from './html.js';
import { sanitizeExportObject } from './sanitize.js';
import {
  importSession,
  importFromString,
  importFromBuffer,
  detectFormatFromExtension,
  ImportOptions
} from './importers.js';
import type { 
  ExportableSession, 
  ExportFormat, 
  ExportOptions, 
  ExportResult,
} from './types.js';
import { ExportError } from './types.js';
import { Logger } from '../logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const logger = Logger.getInstance('exporters');

/**
 * Esporta una sessione nel formato specificato con sanitizzazione e validazione
 * 
 * @param session - Dati della sessione da esportare (ChatSession o ExportPayload)
 * @param format - Formato di esportazione (default: 'JSON')
 * @param options - Opzioni di esportazione e sanitizzazione
 * @returns Risultato dell'esportazione con contenuto, formato e timestamp
 * @throws {ExportError} Se l'esportazione fallisce
 */
export function exportSession(
  session: ExportableSession,
  format: ExportFormat = 'JSON',
  options: Partial<ExportOptions> = {}
): ExportResult {
  try {
    // Sanitizza i dati prima dell'esportazione
    const sanitizedData = sanitizeExportObject(session, options);
    logger.debug(`Dati sanitizzati per esportazione in formato ${format}`);
    
    // Determina la funzione di serializzazione in base al formato
    let content: string;
    
    switch (format) {
      case 'JSON':
        content = toJSON(sanitizedData, { indent: options.pretty ? 2 : 0 });
        break;
      case 'YAML':
        content = toYAML(sanitizedData, { indent: options.pretty ? 2 : 0 });
        break;
      case 'Markdown':
        content = toMarkdown(sanitizedData);
        break;
      case 'CSV':
        content = sessionToCSV(sanitizedData, {
          separator: options.csvSeparator,
          includeHeader: options.csvIncludeHeader
        });
        break;
      case 'HTML':
        content = toHTML(sanitizedData, {
          title: options.title || 'Conversazione Esportata',
          includeStyles: true
        });
        break;
      default:
        throw new ExportError(`Formato di esportazione non valido: ${format}`);
    }
    
    // Crea il risultato dell'esportazione
    const result: ExportResult = {
      content,
      format,
      timestamp: Date.now()
    };
    
    logger.info(`Esportazione completata con successo in formato ${format}`);
    return result;
    
  } catch (error) {
    logger.error(`Errore durante l'esportazione in formato ${format}`, { cause: error });
    throw new ExportError(
      `Errore durante l'esportazione in formato ${format}: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

/**
 * Esporta e salva la sessione su file
 * 
 * @param session - Dati della sessione da esportare
 * @param filePath - Percorso dove salvare il file
 * @param format - Formato di esportazione
 * @param options - Opzioni di esportazione
 * @returns Promise che si risolve con il percorso del file salvato
 * @throws {ExportError} Se il salvataggio fallisce
 */
export async function exportSessionToFile(
  session: ExportableSession,
  filePath: string,
  format: ExportFormat = 'JSON',
  options: Partial<ExportOptions> = {}
): Promise<string> {
  try {
    // Esegue l'esportazione
    const result = exportSession(session, format, options);
    
    // Crea la cartella di destinazione se non esiste
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      await mkdirAsync(directory, { recursive: true });
    }
    
    // Determina l'encoding da utilizzare (default: utf-8)
    const encoding = options.encoding || 'utf-8';
    
    // Salva il contenuto nel file
    await writeFileAsync(filePath, result.content, { encoding: encoding as BufferEncoding });
    
    logger.info(`Sessione esportata e salvata con successo in ${filePath}`);
    return filePath;
    
  } catch (error) {
    logger.error(`Errore durante l'esportazione e salvataggio della sessione`, { cause: error });
    throw new ExportError(
      `Errore durante l'esportazione e salvataggio in ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

/**
 * Estensioni dei file per i vari formati di esportazione
 */
export const formatExtensions: Record<ExportFormat, string> = {
  'JSON': '.json',
  'YAML': '.yaml',
  'Markdown': '.md',
  'CSV': '.csv',
  'HTML': '.html'
};

/**
 * Ottiene l'estensione appropriata per un formato di esportazione
 * 
 * @param format - Il formato di esportazione
 * @returns L'estensione del file associata al formato
 */
export function getFormatExtension(format: ExportFormat): string {
  return formatExtensions[format] || '.txt';
}

/**
 * Suggerisce un nome di file con estensione corretta in base al formato
 * 
 * @param format - Formato di esportazione
 * @param prefix - Prefisso per il nome del file (default: 'sessione')
 * @returns Nome del file suggerito con timestamp e estensione corretta
 */
export function suggestFilename(format: ExportFormat, prefix: string = 'sessione'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = getFormatExtension(format);
  return `${prefix}-${timestamp}${extension}`;
}

/**
 * Converte una sessione da un formato all'altro
 * 
 * @param content - Contenuto da convertire
 * @param fromFormat - Formato di origine
 * @param toFormat - Formato di destinazione
 * @param options - Opzioni di esportazione
 * @returns Contenuto convertito nel nuovo formato
 * @throws {ExportError} Se la conversione fallisce
 */
export function convertFormat(
  content: string,
  fromFormat: ExportFormat,
  toFormat: ExportFormat,
  options: Partial<ExportOptions> = {}
): string {
  try {
    logger.debug(`Conversione da ${fromFormat} a ${toFormat}`);
    
    // Importa la sessione dal formato di origine
    const session = importFromString(content, fromFormat);
    
    // Esporta la sessione nel formato di destinazione
    const result = exportSession(session, toFormat, options);
    
    logger.info(`Conversione da ${fromFormat} a ${toFormat} completata con successo`);
    return result.content;
    
  } catch (error) {
    logger.error(`Errore durante la conversione da ${fromFormat} a ${toFormat}`, { cause: error });
    throw new ExportError(
      `Errore durante la conversione da ${fromFormat} a ${toFormat}: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}

// Esporta funzioni e tipi pubblici
export * from './types.js';
export * from './sanitize.js';
export * from './serializers.js';
export * from './markdown.js';
export * from './csv.js';
export * from './html.js';
export {
  importSession,
  importFromString,
  importFromBuffer,
  detectFormatFromExtension,
  ImportOptions
}; 