/**
 * @file utils.ts
 * @description Funzioni di utilità per il modulo ai-bridge
 * @author dev ai 1
 */

/**
 * Genera un ID univoco per una richiesta
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Valida una risposta AI
 */
export function validateAiResponse(response: unknown): response is { text: string } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'text' in response &&
    typeof (response as any).text === 'string'
  );
}

/**
 * Formatta un errore in una stringa leggibile
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Si è verificato un errore sconosciuto';
}

/**
 * Verifica se una richiesta è scaduta
 */
export function isRequestExpired(startTime: number, timeout: number): boolean {
  return Date.now() - startTime > timeout;
}

/**
 * Formatta il conteggio dei token in una stringa leggibile
 */
export function formatTokenCount(tokens: number): string {
  return tokens.toLocaleString('it-IT');
} 
 