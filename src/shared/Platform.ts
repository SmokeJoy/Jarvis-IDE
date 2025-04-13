/**
 * Tipi per la gestione delle informazioni di piattaforma
 */

/**
 * Rappresenta le informazioni sulla piattaforma su cui è in esecuzione l'applicazione
 */
export interface Platform {
  /** Nome della piattaforma (win32, darwin, linux) */
  os: string;

  /** Versione del sistema operativo */
  osVersion: string;

  /** Architettura della CPU (x64, arm64, ecc.) */
  arch: string;

  /** Versione di Node.js in uso */
  nodeVersion: string;

  /** Versione di VS Code in cui è integrato */
  vscodeVersion?: string;

  /** Indica se l'applicazione è in esecuzione come estensione VS Code */
  isVsCode: boolean;

  /** Indica se l'applicazione è in esecuzione in modalità sviluppo */
  isDev: boolean;

  /** Percorso della directory home dell'utente */
  homeDir: string;

  /** Percorso della directory di configurazione dell'app */
  configDir: string;
}
