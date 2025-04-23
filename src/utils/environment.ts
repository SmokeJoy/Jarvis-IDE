/**
 * Utility per gestire le variabili d'ambiente
 */

/**
 * Controlla se l'applicazione è in modalità sviluppo
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Controlla se l'applicazione è in modalità test
 */
export function isTestMode(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Controlla se l'applicazione è in modalità produzione
 */
export function isProductionMode(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Ottiene il valore di una variabile d'ambiente
 */
export function getEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] ?? defaultValue;
}

/**
 * Controlla se una variabile d'ambiente è definita
 */
export function hasEnvVar(name: string): boolean {
  return name in process.env;
} 