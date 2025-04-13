/**
 * Imposta il livello di log
 */
declare function setLogLevel(level: number): void;
export declare const logger: {
  setLevel: typeof setLogLevel;
  debug: (message: string, error?: Error) => void;
  info: (message: string, error?: Error) => void;
  warn: (message: string, error?: Error) => void;
  error: (message: string, error?: Error) => void;
};
/**
 * Logger statico per l'estensione
 */
export declare class Logger {
  private static initialized;
  private static logFile;
  private static outputChannel;
  private _name;
  /**
   * Costruttore del logger
   */
  constructor(name?: string);
  /**
   * Inizializza il logger
   */
  static init(context: any): void;
  /**
   * Registra un messaggio di debug
   */
  static debug(message: string, error?: any): void;
  /**
   * Registra un messaggio informativo
   */
  static info(message: string, error?: any): void;
  /**
   * Registra un messaggio di avviso
   */
  static warn(message: string, error?: any): void;
  /**
   * Registra un messaggio di errore
   */
  static error(message: string, error?: any): void;
  /**
   * Registra un messaggio
   */
  private static log;
  /**
   * Metodi di istanza che delegano ai metodi statici
   */
  debug(message: string, error?: any): void;
  info(message: string, error?: any): void;
  warn(message: string, error?: any): void;
  error(message: string, error?: any): void;
}
export {};
//# sourceMappingURL=logger.d.ts.map
