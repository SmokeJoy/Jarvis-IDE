/**
 * @file Logger.ts
 * @description Classe singleton per la gestione dei log dell'applicazione
 * con supporto per diversi livelli di log e formattazione
 */

// Enumerazione dei livelli di log supportati
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Interfaccia per le opzioni di configurazione del logger
interface LoggerOptions {
  level: LogLevel;
  prefix?: string;
  enableConsole?: boolean;
}

/**
 * Classe Logger che implementa il pattern Singleton per
 * gestire i log dell'applicazione in modo centralizzato
 */
export class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private prefix: string;
  private enableConsole: boolean;

  /**
   * Costruttore privato per implementare il pattern Singleton
   * @param options Opzioni di configurazione del logger
   */
  private constructor(options: LoggerOptions) {
    this.level = options.level || LogLevel.INFO;
    this.prefix = options.prefix || 'WebviewUI';
    this.enableConsole = options.enableConsole !== undefined ? options.enableConsole : true;
  }

  /**
   * Ottiene l'istanza singleton del logger
   * @param options Opzioni di configurazione del logger (usate solo alla prima chiamata)
   * @returns L'istanza del logger
   */
  public static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options || { level: LogLevel.INFO });
    }
    return Logger.instance;
  }

  /**
   * Configura il logger con nuove opzioni
   * @param options Opzioni di configurazione del logger
   */
  public configure(options: Partial<LoggerOptions>): void {
    if (options.level !== undefined) this.level = options.level;
    if (options.prefix !== undefined) this.prefix = options.prefix;
    if (options.enableConsole !== undefined) this.enableConsole = options.enableConsole;
  }

  /**
   * Ottiene il timestamp formattato per i messaggi di log
   * @returns Il timestamp formattato
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Formatta un messaggio di log
   * @param level Il livello di log
   * @param message Il messaggio da loggare
   * @returns Il messaggio formattato
   */
  private formatMessage(level: LogLevel, message: string): string {
    return `[${this.getTimestamp()}] [${this.prefix}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Determina se un messaggio di un certo livello deve essere loggato
   * in base al livello configurato
   * @param level Il livello di log da verificare
   * @returns true se il messaggio deve essere loggato, false altrimenti
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const configLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= configLevelIndex;
  }

  /**
   * Logga un messaggio al livello di debug
   * @param message Il messaggio da loggare
   * @param data Dati aggiuntivi da includere nel log
   */
  public debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message);
    if (this.enableConsole) {
      if (data) {
        console.debug(formattedMessage, data);
      } else {
        console.debug(formattedMessage);
      }
    }
  }

  /**
   * Logga un messaggio al livello di info
   * @param message Il messaggio da loggare
   * @param data Dati aggiuntivi da includere nel log
   */
  public info(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.INFO, message);
    if (this.enableConsole) {
      if (data) {
        console.info(formattedMessage, data);
      } else {
        console.info(formattedMessage);
      }
    }
  }

  /**
   * Logga un messaggio al livello di warning
   * @param message Il messaggio da loggare
   * @param data Dati aggiuntivi da includere nel log
   */
  public warn(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.WARN, message);
    if (this.enableConsole) {
      if (data) {
        console.warn(formattedMessage, data);
      } else {
        console.warn(formattedMessage);
      }
    }
  }

  /**
   * Logga un messaggio al livello di errore
   * @param message Il messaggio da loggare
   * @param error Errore o dati aggiuntivi da includere nel log
   */
  public error(message: string, error?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message);
    if (this.enableConsole) {
      if (error) {
        console.error(formattedMessage, error);
      } else {
        console.error(formattedMessage);
      }
    }
  }
}

// Esporta un'istanza singleton del logger già configurata
export const logger = Logger.getInstance({
  level: LogLevel.DEBUG,
  prefix: 'WebviewUI',
  enableConsole: true
}); 