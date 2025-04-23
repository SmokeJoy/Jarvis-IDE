import { z } from 'zod';
import { LogLevel } from '../shared/types/global';
import { JarvisProvider as JarvisProviderType } from '../core/webview/JarvisProvider';
import { appendLogToFile as appendLogToFileType } from './logStorage';
import * as vscode from 'vscode';
import * as fs from 'fs';

let JarvisProvider: typeof JarvisProviderType;
let appendLogToFile: typeof appendLogToFileType;

// Determinazione dell'ambiente di esecuzione
const isTestEnvironment = process.env['NODE_ENV'] === 'test';
const sendToWebView = process.env['LOG_TO_WEBVIEW'] !== 'false' && !isTestEnvironment;

if (!isTestEnvironment) {
  import('../core/webview/JarvisProvider.js')
    .then((module) => {
      JarvisProvider = module.JarvisProvider;
    })
    .catch((err) => {
      console.error('Failed to import JarvisProvider:', err);
    });

  import('./logStorage.js')
    .then((module) => {
      appendLogToFile = module.appendLogToFile;
    })
    .catch((err) => {
      console.error('Failed to import log storage utils:', err);
    });
}

/**
 * Verifica se un livello è attivo in base al livello corrente
 */
function isLevelActive(currentLevel: number, level: number): boolean {
  return level >= currentLevel;
}

// Livello di log corrente
let currentLevel = 1; // Default: INFO

/**
 * Imposta il livello di log
 */
function setLogLevel(level: number): void {
  currentLevel = level;
}

/**
 * Genera un timestamp nel formato YYYY-MM-DD HH:MM:SS.mmm
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').replace('Z', '');
}

/**
 * Invia un messaggio di log alla WebView
 */
function sendLogToWebView(timestamp: string, level: keyof typeof LogLevel, message: string) {
  if (!sendToWebView || isTestEnvironment || !JarvisProvider) return;

  // Trova un provider visibile e invia il messaggio
  const visibleProvider = JarvisProvider.getVisibleInstance();
  if (visibleProvider) {
    visibleProvider.postMessageToWebview({
      type: 'log.update',
      logEntry: {
        timestamp,
        level,
        message,
      },
    } as any);
  }
}

/**
 * Metodo base per logging
 */
function log(level: keyof typeof LogLevel, levelNum: number, message: string, error?: Error): void {
  if (!isLevelActive(currentLevel, levelNum)) return;

  const timestamp = getTimestamp();
  const formattedMessage = `[${timestamp}] [${String(level)}] ${message}${error ? ` - ${error.stack || error.message}` : ''}`;

  // Log alla console
  const consoleMethod = levelNum >= 3 ? 'error' : levelNum === 2 ? 'warn' : 'log';
  console[consoleMethod](formattedMessage);

  // Log a file se disponibile
  if (appendLogToFile) {
    try {
      appendLogToFile(level, message);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  // Log alla WebView se appropriato
  sendLogToWebView(timestamp, level, message);
}

// Esporta l'oggetto logger con tutti i metodi
export const logger = {
  setLevel: setLogLevel,
  debug: (message: string, error?: Error) => log('DEBUG', 0, message, error),
  info: (message: string, error?: Error) => log('INFO', 1, message, error),
  warn: (message: string, error?: Error) => log('WARN', 2, message, error),
  error: (message: string, error?: Error) => log('ERROR', 3, message, error),
};

/**
 * Logger statico per l'estensione
 */
export class Logger {
  private static initialized = false;
  private static logFile: string | undefined;
  private static outputChannel: vscode.OutputChannel | undefined;
  private _name: string = '';

  /**
   * Costruttore del logger
   */
  constructor(name?: string) {
    this._name = name || '';
  }

  /**
   * Inizializza il logger con un canale di output VS Code
   * @param outputChannel Canale di output VS Code
   */
  static initialize(outputChannel: vscode.OutputChannel): void {
    this.outputChannel = outputChannel;
    this.initialized = true;
    this.info('Logger inizializzato con successo');
  }

  /**
   * Inizializza il logger
   * @deprecated Utilizzare il metodo initialize
   */
  static init(context: any) {
    if (this.initialized) return;
    this.initialized = true;

    // Crea il canale di output VS Code
    this.outputChannel = context?.logOutputChannel;

    // Imposta il file di log
    import('./logStorage.js')
      .then((module) => {
        const fileModule = module as any;
        this.logFile = fileModule.getCurrentLogFile();
      })
      .catch((error) => {
        console.error('Errore durante il caricamento del modulo log storage:', error);
      });
  }

  /**
   * Registra un messaggio di debug
   */
  static debug(message: string, error?: any) {
    this.log(LogLevel.DEBUG, message, error);
  }

  /**
   * Registra un messaggio informativo
   */
  static info(message: string, error?: any) {
    this.log(LogLevel.INFO, message, error);
  }

  /**
   * Registra un messaggio di avviso
   */
  static warn(message: string, error?: any) {
    this.log(LogLevel.WARN, message, error);
  }

  /**
   * Registra un messaggio di errore
   */
  static error(message: string, error?: any) {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * Registra un messaggio
   */
  private static log(level: LogLevel, message: string, error?: any) {
    // Ottieni il timestamp corrente
    const timestamp = new Date().toISOString();

    // Formatta il messaggio
    const formattedMessage = `[${timestamp}] [${level}] ${message}${error ? ` - ${String(error.stack || error.message)}` : ''}`;

    // Registra su console
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // Registra sul canale di output VS Code
    if (this.outputChannel) {
      this.outputChannel.appendLine(formattedMessage);
    }

    // Registra su file
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (err) {
        console.error('Errore durante la scrittura nel file di log:', err);
      }
    }
  }

  /**
   * Metodi di istanza che delegano ai metodi statici
   */
  debug(message: string, error?: any) {
    Logger.debug(`[${this._name}] ${message}`, error);
  }

  info(message: string, error?: any) {
    Logger.info(`[${this._name}] ${message}`, error);
  }

  warn(message: string, error?: any) {
    Logger.warn(`[${this._name}] ${message}`, error);
  }

  error(message: string, error?: any) {
    Logger.error(`[${this._name}] ${message}`, error);
  }

  /**
   * Imposta il livello di log
   */
  setLevel(level: LogLevel): void {
    setLogLevel(level);
  }
}
