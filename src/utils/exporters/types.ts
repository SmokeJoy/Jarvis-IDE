/**
 * Definizioni comuni per i moduli di esportazione
 */
import { ChatMessage } from '../../shared/types.js';
import { ChatSettings } from '../../shared/types/settings.types.js';
import { ChatSession } from '../../shared/types/session.js';
import { SanitizeOptions } from './sanitize.js';

/**
 * Definizione dei tipi per il sistema di esportazione
 * @module utils/exporters/types
 */

/**
 * Tipi e interfacce per il sistema di esportazione
 */

/**
 * Formati di esportazione supportati
 */
export type ExportFormat = 'JSON' | 'CSV' | 'Markdown' | 'YAML' | 'HTML';

/**
 * Opzioni per il processo di sanitizzazione degli oggetti prima dell'esportazione
 */
export interface SanitizeOptions {
  /**
   * Se true, rimuove le proprietà con valore null dagli oggetti
   * @default false
   */
  removeNull?: boolean;

  /**
   * Se true, rimuove le proprietà con valore undefined dagli oggetti
   * @default true
   */
  removeUndefined?: boolean;

  /**
   * Profondità massima di navigazione negli oggetti annidati
   * Gli oggetti più profondi verranno sostituiti con "[Oggetto]"
   * @default 5
   */
  maxDepth?: number;

  /**
   * Lunghezza massima delle stringhe. Le stringhe più lunghe verranno troncate
   * con "..." alla fine
   * @default 100
   */
  maxStringLength?: number;

  /**
   * Numero massimo di elementi in un array. Gli array più lunghi verranno troncati
   * con un messaggio che indica quanti elementi sono stati omessi
   * @default 100
   */
  maxArrayLength?: number;
}

/**
 * Opzioni per l'esportazione dei dati
 */
export interface ExportOptions extends SanitizeOptions {
  /**
   * Percorso dove salvare il file esportato
   */
  path: string;

  /**
   * Formato di esportazione (json, csv, xlsx, ecc.)
   * @default 'json'
   */
  format?: 'json' | 'csv' | 'xlsx';

  /**
   * Se true, i dati verranno formattati in modo leggibile (pretty print)
   * @default true
   */
  pretty?: boolean;

  /**
   * Separatore da utilizzare per i file CSV
   * @default ','
   */
  csvSeparator?: string;

  /**
   * Se true, include l'intestazione nel file CSV
   * @default true
   */
  csvIncludeHeader?: boolean;

  /**
   * Codifica del file
   * @default 'utf-8'
   */
  encoding?: string;
}

/**
 * Tipo generico per i dati esportabili
 */
export type ExportData = Record<string, any> | Array<Record<string, any>>;

/**
 * Interfaccia per un esportatore generico
 */
export interface Exporter<T = any> {
  /**
   * Esporta i dati nel formato specificato
   * @param data I dati da esportare
   * @param options Opzioni di esportazione
   * @returns Il contenuto esportato come stringa
   */
  export(data: T, options?: Partial<ExportOptions>): string;
}

/**
 * Errore specifico per le operazioni di esportazione
 */
export class ExportError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ExportError';
  }
}

/**
 * Interfaccia legacy per dati esportabili
 */
export interface ExportPayload {
  /** Messaggi della chat */
  messages?: ChatMessage[];
  
  /** Impostazioni della chat */
  settings?: ChatSettings;
  
  /** Prompt di sistema */
  systemPrompt?: string;
  
  /** File di contesto */
  contextFiles?: string[];
  
  /** ID del modello */
  modelId?: string;
  
  /** Timestamp */
  timestamp?: number;
}

/**
 * Tipo unione per supportare sia ChatSession che il vecchio formato ExportPayload
 */
export type ExportableSession = ChatSession | ExportPayload;

/**
 * Risultato dell'esportazione
 */
export interface ExportResult {
  /** Contenuto esportato */
  content: string;
  
  /** Formato dell'esportazione */
  format: ExportFormat;
  
  /** Timestamp dell'esportazione */
  timestamp: number;
} 