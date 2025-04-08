/**
 * @file webviewMessageUnion.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi WebView
 * @version 1.0.0
 */

import type { 
  WebviewMessage,
  WebviewMessageType,
  SendPromptMessage,
  ActionMessage,
  ErrorMessage,
  ResponseMessage,
  StateMessage,
  InstructionMessage,
  InstructionCompletedMessage
} from './webview.types.js';

/**
 * Unione discriminata di tutti i tipi di messaggi WebView conosciuti.
 * Questo tipo permette al compilatore TypeScript di distinguere
 * automaticamente il tipo specifico basandosi sul campo 'type'.
 */
export type WebviewMessageUnion =
  | SendPromptMessage
  | ActionMessage
  | ErrorMessage
  | ResponseMessage
  | StateMessage
  | InstructionMessage
  | InstructionCompletedMessage;

/**
 * Type guard per verificare se un messaggio è un SendPromptMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SendPromptMessage
 */
export function isSendPromptMessage(message: WebviewMessage<any>): message is SendPromptMessage {
  return message?.type === WebviewMessageType.SEND_PROMPT;
}

/**
 * Type guard per verificare se un messaggio è un ActionMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ActionMessage
 */
export function isActionMessage(message: WebviewMessage<any>): message is ActionMessage {
  return message?.type === "action";
}

/**
 * Type guard per verificare se un messaggio è un ErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ErrorMessage
 */
export function isErrorMessage(message: WebviewMessage<any>): message is ErrorMessage {
  return message?.type === "error";
}

/**
 * Type guard per verificare se un messaggio è un ResponseMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ResponseMessage
 */
export function isResponseMessage(message: WebviewMessage<any>): message is ResponseMessage {
  return message?.type === "response";
}

/**
 * Type guard per verificare se un messaggio è un StateMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un StateMessage
 */
export function isStateMessage(message: WebviewMessage<any>): message is StateMessage {
  return message?.type === "state";
}

/**
 * Type guard per verificare se un messaggio è un InstructionMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un InstructionMessage
 */
export function isInstructionMessage(message: WebviewMessage<any>): message is InstructionMessage {
  return message?.type === WebviewMessageType.INSTRUCTION_RECEIVED || 
         message?.type === WebviewMessageType.INSTRUCTION_COMPLETED || 
         message?.type === WebviewMessageType.INSTRUCTION_FAILED;
}

/**
 * Type guard per verificare se un messaggio è un InstructionCompletedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un InstructionCompletedMessage
 */
export function isInstructionCompletedMessage(message: WebviewMessage<any>): message is InstructionCompletedMessage {
  return message?.type === "instructionCompleted";
}

/**
 * Versione migliorata di castAs che include un validatore opzionale
 * @param value Il valore da convertire
 * @param validator Funzione di validazione opzionale
 * @returns Il valore convertito al tipo T o null se la validazione fallisce
 */
export function safeCastAs<T>(value: unknown, validator?: (val: any) => boolean): T | null {
  if (validator && !validator(value)) {
    console.warn(`[safeCastAs] Validazione fallita per il tipo: ${typeof value}`);
    return null;
  }
  return value as T;
}

/**
 * Helpers per validare i tipi di messaggi WebView più comuni
 */
export const validators = {
  isSendPrompt: (d: any): d is SendPromptMessage => d?.type === WebviewMessageType.SEND_PROMPT,
  isAction: (d: any): d is ActionMessage => d?.type === "action",
  isError: (d: any): d is ErrorMessage => d?.type === "error",
  isResponse: (d: any): d is ResponseMessage => d?.type === "response",
  isState: (d: any): d is StateMessage => d?.type === "state"
}; 