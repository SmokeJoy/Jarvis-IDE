/**
 * @file message.ts
 * @description Definisce le interfacce per i messaggi completi scambiati tra WebView ed Extension
 */

import { MessageType } from './message-type';
import { PayloadType } from './message-payloads';

/**
 * Interfaccia di base per tutti i messaggi
 */
export interface BaseMessage {
  /** Tipo di messaggio */
  type: MessageType;
  /** Payload del messaggio (specifico per tipo) */
  payload?: unknown;
  /** Errore eventuale */
  error?: string;
}

/**
 * Interfaccia per un messaggio con tipo validato
 * @template T - Tipo di messaggio (deve estendere MessageType)
 */
export interface TypedMessage<T extends MessageType> extends BaseMessage {
  /** Tipo di messaggio (specializzato) */
  type: T;
  /** Payload del messaggio (specializzato per tipo T) */
  payload: PayloadType<T>;
}

/**
 * Tipo per messaggi inviati dalla WebView all'Extension
 */
export type ToExtensionMessage = {
  [T in MessageType]: TypedMessage<T>;
}[MessageType];

/**
 * Tipo per messaggi inviati dall'Extension alla WebView
 */
export type FromExtensionMessage = {
  [T in MessageType]: TypedMessage<T>;
}[MessageType];

/**
 * Tipo unione per tutti i messaggi possibili
 */
export type WebviewMessage = ToExtensionMessage | FromExtensionMessage;

/**
 * Interfaccia per il gestore di messaggi
 */
export interface MessageHandler<T extends MessageType> {
  /** Funzione che gestisce il messaggio */
  (message: TypedMessage<T>): void | Promise<void>;
}

/**
 * Mappa dei gestori di messaggi
 */
export interface MessageHandlerMap {
  [key: string]: MessageHandler<any>;
}

/**
 * Funzione per creare un messaggio tipizzato
 * @param type Tipo di messaggio
 * @param payload Payload del messaggio
 * @param error Errore opzionale
 * @returns Messaggio tipizzato
 */
export function createMessage<T extends MessageType>(
  type: T,
  payload: PayloadType<T>,
  error?: string
): TypedMessage<T> {
  return {
    type,
    payload,
    ...(error && { error }),
  } as TypedMessage<T>;
}

/**
 * Funzione per verificare se un oggetto è un messaggio di un tipo specifico
 * @param message Messaggio da verificare
 * @param type Tipo di messaggio atteso
 * @returns Guardia di tipo che conferma se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends MessageType>(
  message: BaseMessage,
  type: T
): message is TypedMessage<T> {
  return message.type === type;
}

/**
 * Funzione per estrarre in modo sicuro il payload di un messaggio
 * @param message Messaggio di cui estrarre il payload
 * @returns Il payload del messaggio come tipo specificato
 */
export function getPayload<T extends MessageType>(
  message: TypedMessage<T>
): PayloadType<T> {
  return message.payload;
}

/**
 * Funzione per estrarre in modo sicuro un campo specifico dal payload di un messaggio
 * @param message Messaggio di cui estrarre il campo
 * @param field Nome del campo da estrarre
 * @returns Il valore del campo o undefined se non esiste
 */
export function getPayloadField<T extends MessageType, K extends keyof PayloadType<T>>(
  message: TypedMessage<T>,
  field: K
): PayloadType<T>[K] | undefined {
  if (!message.payload) {
    return undefined;
  }
  
  return message.payload[field];
}

/**
 * Unione di tutti i possibili messaggi fortemente tipizzati
 */
export type AnyMessage = {
  [T in MessageType]: TypedMessage<T>
}[MessageType]; 