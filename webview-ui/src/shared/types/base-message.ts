/**
 * @file base-message.ts
 * @description Definizione delle interfacce base per i messaggi tra WebView e VS Code
 */

/**
 * Interfaccia per un payload generico
 * Ogni payload specifico dovrebbe estendere questa interfaccia
 */
export interface BasePayload {
  [key: string]: unknown;
}

/**
 * Interfaccia per un messaggio base
 * Tutti i messaggi scambiati tra WebView e VS Code seguono questa struttura
 */
export interface BaseMessage<T extends string = string, P extends BasePayload = BasePayload> {
  /**
   * Tipo del messaggio, usato per identificare il messaggio e il suo gestore
   */
  type: T;
  
  /**
   * Payload del messaggio, contiene i dati specifici del messaggio
   */
  payload: P;
  
  /**
   * Messaggio di errore opzionale
   */
  error?: string;
}

/**
 * Tipo di base per le unioni di messaggi
 * Usato per definire tutti i possibili messaggi che possono essere scambiati
 */
export type WebviewMessage = BaseMessage<string, BasePayload>;

/**
 * Tipo per i messaggi inviati dall'estensione alla WebView
 */
export type FromExtensionMessage = BaseMessage<string, BasePayload>;

/**
 * Tipo per i messaggi inviati dalla WebView all'estensione
 */
export type ToExtensionMessage = BaseMessage<string, BasePayload>;

/**
 * Tipo per la risposta a un messaggio
 * Estende BaseMessage con il campo originType che identifica il messaggio originale
 */
export interface ResponseMessage<T extends string = string, P extends BasePayload = BasePayload> 
  extends BaseMessage<T, P> {
  /**
   * Tipo del messaggio originale a cui si sta rispondendo
   */
  originalType: string;
  
  /**
   * Indica se il messaggio è una risposta di successo o errore
   */
  success: boolean;
}

/**
 * Funzione helper per creare un nuovo messaggio
 * @param type - Tipo del messaggio
 * @param payload - Payload del messaggio
 * @param error - Messaggio di errore opzionale
 * @returns Un nuovo oggetto messaggio
 */
export function createMessage<T extends string, P extends BasePayload>(
  type: T, 
  payload: P, 
  error?: string
): BaseMessage<T, P> {
  return {
    type,
    payload,
    ...(error ? { error } : {})
  };
}

/**
 * Funzione helper per creare un messaggio di risposta
 * @param originalType - Tipo del messaggio originale
 * @param type - Tipo della risposta
 * @param payload - Payload della risposta
 * @param success - Indica se la risposta è di successo
 * @param error - Messaggio di errore opzionale
 * @returns Un nuovo oggetto messaggio di risposta
 */
export function createResponseMessage<T extends string, P extends BasePayload>(
  originalType: string,
  type: T,
  payload: P,
  success: boolean,
  error?: string
): ResponseMessage<T, P> {
  return {
    type,
    originalType,
    payload,
    success,
    ...(error ? { error } : {})
  };
} 