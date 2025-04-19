import { Logger } from '../utils/logger';

const logger = new Logger('retry');

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_OPTIONS: Readonly<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

/**
 * Calcola il delay per il prossimo tentativo usando exponential backoff
 */
function calculateDelay(attempt: number, options: Readonly<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffFactor, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * Esegue una funzione con retry in caso di errore
 * @param fn Funzione da eseguire
 * @param options Opzioni di retry
 * @returns Promise con il risultato della funzione
 * @throws Error se tutti i tentativi falliscono
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Readonly<Partial<RetryOptions>> = {}
): Promise<T> {
  const retryOptions: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === retryOptions.maxAttempts) {
        logger.error(`Tutti i tentativi falliti (${retryOptions.maxAttempts}):`, lastError);
        throw lastError;
      }

      const delay = calculateDelay(attempt, retryOptions);
      logger.debug(`Tentativo ${attempt} fallito, nuovo tentativo tra ${delay}ms:`, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Questo non dovrebbe mai accadere grazie al throw sopra
  throw new Error('Unexpected error in retry logic');
}

type AnyFunction = (...args: any[]) => Promise<any>;

/**
 * Wrapper per funzioni che richiedono retry
 * @param fn Funzione da wrappare
 * @param options Opzioni di retry
 * @returns Funzione wrappata con retry
 */
export function withRetryWrapper<T extends AnyFunction>(
  fn: T,
  options: Readonly<Partial<RetryOptions>> = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

