/**
 * Utilità per la validazione e il casting di tipi sicuro
 */

import type { WebviewMessage } from './WebviewMessage.js';
import type { ExtensionMessage } from './ExtensionMessage.js';

/**
 * Verifica se un oggetto è un messaggio WebView valido
 * @param obj L'oggetto da verificare
 * @returns True se l'oggetto è un WebviewMessage valido
 */
export function isWebviewMessage(obj: unknown): obj is WebviewMessage {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const candidate = obj as Record<string, unknown>;
  // Verifica che ci sia un campo 'type' di tipo stringa
  if (typeof candidate.type !== 'string') {
    return false;
  }
  
  // Elenco di tutti i tipi validi di messaggi WebView
  const validTypes: string[] = [
    'getSettings', 'saveSettings', 'chatRequest', 
    'cancelRequest', 'clearChat', 'resetApiKey',
    'exportChat', 'executeCommand', 'selectFiles',
    'loadContext', 'modelSwitch', 'progressUpdate'
  ];
  
  return validTypes.includes(candidate.type);
}

/**
 * Verifica se un oggetto è un messaggio di estensione valido
 * @param obj L'oggetto da verificare
 * @returns True se l'oggetto è un ExtensionMessage valido
 */
export function isExtensionMessage(obj: unknown): obj is ExtensionMessage {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  const candidate = obj as Record<string, unknown>;
  // Verifica che ci sia un campo 'type' di tipo stringa
  if (typeof candidate.type !== 'string') {
    return false;
  }
  
  // Elenco di tutti i tipi validi di messaggi di estensione
  const validTypes: string[] = [
    'response', 'requestProgress', 'settings', 
    'error', 'telemetry', 'modelList',
    'contextFiles', 'chatHistory', 'apiKeyReset',
    'exportResult', 'commandResult', 'notification'
  ];
  
  return validTypes.includes(candidate.type);
}

/**
 * Esegue un cast sicuro di un oggetto a un tipo specifico
 * Lancia un errore se l'oggetto non è valido
 * @param obj L'oggetto da castare
 * @returns L'oggetto castato al tipo T
 * @throws Error se l'oggetto non è valido
 */
export function safeCastAs<T>(obj: unknown): T {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`Invalid object: ${JSON.stringify(obj)}`);
  }
  return obj as T;
}

/**
 * Guard rigoroso che applica una funzione di validazione e genera un errore
 * se l'input non è valido
 * @param unionGuard Funzione guard da applicare (es. isWebviewMessage)
 * @param name Nome del tipo per il messaggio di errore
 * @returns Una funzione che valida input e ritorna il tipo o lancia errore
 */
export function strictGuard<T>(
  unionGuard: (input: any) => boolean, 
  name: string
): (input: unknown) => T {
  return (input: unknown): T => {
    if (!unionGuard(input)) {
      throw new Error(`Invalid ${name} format: ${JSON.stringify(input)}`);
    }
    return input as T;
  };
}

// Esportazione di utility preconfigurate
export const requireWebviewMessage = strictGuard<WebviewMessage>(
  isWebviewMessage,
  'WebviewMessage'
);

export const requireExtensionMessage = strictGuard<ExtensionMessage>(
  isExtensionMessage,
  'ExtensionMessage'
); 