/**
 * @file outputLogger.ts
 * @description Logger strutturato per il sistema MAS con supporto per telemetria
 * @version 1.0.0
 */

/**
 * Livelli del logger
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
  TELEMETRY = 'telemetry'
}

/**
 * Interfaccia per un record di log
 */
interface LogRecord {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  componentName?: string;
  sessionId?: string;
  agentName?: string;
}

/**
 * Interfaccia per un ascoltatore di log
 */
export interface LogListener {
  (record: LogRecord): void;
}

/**
 * Opzioni di configurazione del logger
 */
export interface LoggerOptions {
  /** Nome del componente che genera il log */
  componentName?: string;
  /** ID univoco della sessione corrente */
  sessionId?: string;
  /** Nome dell'agente AI se applicabile */
  agentName?: string;
  /** Livello minimo di log da emettere */
  minLevel?: LogLevel;
  /** Se true, impedisce la stampa a console */
  silent?: boolean;
  /** Se true, include timestamp */
  includeTimestamp?: boolean;
  /** Se true, emette anche come JSON */
  emitJSON?: boolean;
}

/**
 * Formattatore per i messaggi di log
 */
const formatters = {
  console: (record: LogRecord): string => {
    const { level, message, timestamp, componentName, agentName } = record;
    
    let prefix = `[${timestamp}]`;
    if (componentName) {
      prefix += ` [${componentName}]`;
    }
    if (agentName) {
      prefix += ` [Agent:${agentName}]`;
    }
    prefix += ` [${level.toUpperCase()}]`;
    
    return `${prefix} ${message}`;
  },
  
  json: (record: LogRecord): string => {
    return JSON.stringify(record);
  }
};

/**
 * Lista di ascoltatori registrati
 */
const listeners: LogListener[] = [];

/**
 * Configurazione di default del logger
 */
const defaultOptions: LoggerOptions = {
  minLevel: LogLevel.INFO,
  silent: false,
  includeTimestamp: true,
  emitJSON: false
};

/**
 * Logger principale
 */
class Logger {
  private options: LoggerOptions;
  
  constructor(options: LoggerOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }
  
  /**
   * Registra un messaggio a livello DEBUG
   * @param message Messaggio di log
   * @param context Contesto opzionale
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Registra un messaggio a livello INFO
   * @param message Messaggio di log
   * @param context Contesto opzionale
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Registra un messaggio a livello WARN
   * @param message Messaggio di log
   * @param context Contesto opzionale
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  /**
   * Registra un messaggio a livello ERROR
   * @param message Messaggio di log
   * @param context Contesto opzionale
   */
  public error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }
  
  /**
   * Registra un messaggio a livello FATAL
   * @param message Messaggio di log
   * @param context Contesto opzionale
   */
  public fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }
  
  /**
   * Registra un evento di telemetria
   * @param message Nome dell'evento di telemetria
   * @param context Dati di telemetria
   */
  public telemetry(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TELEMETRY, message, context);
  }
  
  /**
   * Registra un messaggio al livello specificato
   * @param level Livello di log
   * @param message Messaggio di log
   * @param context Contesto opzionale
   */
  public log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Skip se il livello è inferiore al minimo configurato
    if (!this.shouldLog(level)) {
      return;
    }
    
    const timestamp = this.options.includeTimestamp ? new Date().toISOString() : '';
    
    const record: LogRecord = {
      level,
      message,
      timestamp,
      context,
      componentName: this.options.componentName,
      sessionId: this.options.sessionId,
      agentName: this.options.agentName
    };
    
    // Emetti a console se non in modalità silent
    if (!this.options.silent) {
      this.emitToConsole(record);
    }
    
    // Notifica gli ascoltatori
    this.notifyListeners(record);
  }
  
  /**
   * Determina se un certo livello di log dovrebbe essere emesso
   * @param level Livello da verificare
   * @returns true se il livello dovrebbe essere loggato
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL
    ];
    
    // Telemetria viene sempre loggata se richiesta
    if (level === LogLevel.TELEMETRY) {
      return true;
    }
    
    const minLevelIndex = levels.indexOf(this.options.minLevel || LogLevel.INFO);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  /**
   * Emette il record di log alla console
   * @param record Record di log
   */
  private emitToConsole(record: LogRecord): void {
    const formattedMessage = formatters.console(record);
    
    switch (record.level) {
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
      case LogLevel.FATAL:
        console.error(formattedMessage);
        break;
      case LogLevel.TELEMETRY:
        // Di default non emette a console, solo ai listener
        break;
    }
    
    // Se richiesto, emetti anche come JSON
    if (this.options.emitJSON) {
      const jsonMessage = formatters.json(record);
      console.log(jsonMessage);
    }
  }
  
  /**
   * Notifica tutti gli ascoltatori registrati
   * @param record Record di log
   */
  private notifyListeners(record: LogRecord): void {
    for (const listener of listeners) {
      try {
        listener(record);
      } catch (error) {
        console.error(`Errore nel listener di log: ${error}`);
      }
    }
  }
  
  /**
   * Crea un nuovo logger con opzioni ereditate più nuove opzioni
   * @param options Nuove opzioni
   * @returns Nuova istanza del logger
   */
  public createSubLogger(options: LoggerOptions): Logger {
    return new Logger({
      ...this.options,
      ...options
    });
  }
  
  /**
   * Aggiorna le opzioni del logger corrente
   * @param options Nuove opzioni da applicare
   */
  public updateOptions(options: Partial<LoggerOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }
}

/**
 * Singleton logger di default
 */
export const logger = new Logger();

/**
 * Aggiunge un ascoltatore di log
 * @param listener Funzione ascoltatore
 */
export function addLogListener(listener: LogListener): void {
  listeners.push(listener);
}

/**
 * Rimuove un ascoltatore di log
 * @param listener Ascoltatore da rimuovere
 */
export function removeLogListener(listener: LogListener): void {
  const index = listeners.indexOf(listener);
  if (index !== -1) {
    listeners.splice(index, 1);
  }
}

/**
 * Rimuove tutti gli ascoltatori di log
 */
export function removeAllLogListeners(): void {
  listeners.length = 0;
}

/**
 * Funzione per creare un logger per un componente specifico
 * @param componentName Nome del componente
 * @param options Opzioni aggiuntive
 * @returns Logger configurato per il componente
 */
export function createComponentLogger(componentName: string, options: Partial<LoggerOptions> = {}): Logger {
  return logger.createSubLogger({
    componentName,
    ...options
  });
}

/**
 * Funzione per creare un logger per un agente specifico
 * @param agentName Nome dell'agente
 * @param options Opzioni aggiuntive
 * @returns Logger configurato per l'agente
 */
export function createAgentLogger(agentName: string, options: Partial<LoggerOptions> = {}): Logger {
  return logger.createSubLogger({
    agentName,
    ...options
  });
}

/**
 * Funzione per creare un logger per una sessione specifica
 * @param sessionId ID della sessione
 * @param options Opzioni aggiuntive
 * @returns Logger configurato per la sessione
 */
export function createSessionLogger(sessionId: string, options: Partial<LoggerOptions> = {}): Logger {
  return logger.createSubLogger({
    sessionId,
    ...options
  });
}

export default {
  logger,
  LogLevel,
  addLogListener,
  removeLogListener,
  removeAllLogListeners,
  createComponentLogger,
  createAgentLogger,
  createSessionLogger
}; 