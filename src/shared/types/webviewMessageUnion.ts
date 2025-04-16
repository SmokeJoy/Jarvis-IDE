/**
 * @file webviewMessageUnion.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi WebView
 * @version 1.0.0
 */

import {
  WebviewMessage,
  WebviewMessageType,
  SendPromptMessage,
  ActionMessage,
  ErrorMessage,
  ResponseMessage,
  StateMessage,
  InstructionMessage,
  InstructionCompletedMessage,
} from './webview.types';

import { ZodSchemaMap } from '../../utils/validation';
import type { LLMStreamToken } from './llm.types';

/**
 * Unione discriminata di tutti i tipi di messaggi WebView conosciuti.
 * Questo tipo permette al compilatore TypeScript di distinguere
 * automaticamente il tipo specifico basandosi sul campo 'type'.
 */
export type WebviewMessageUnion =
  | InstructionCompletedMessage
  | InstructionFailedMessage
  | AgentTypingMessage
  | AgentTypingDoneMessage
  | LlmCancelMessage
  | DisconnectMessage
  | AgentTaskCreatedMessage
  | AgentTaskDoneMessage
  | WebSocketErrorMessage;

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
  return message?.type === 'action';
}

/**
 * Type guard per verificare se un messaggio è un ErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ErrorMessage
 */
export function isErrorMessage(message: WebviewMessage<any>): message is ErrorMessage {
  return message?.type === 'error';
}

/**
 * Type guard per verificare se un messaggio è un ResponseMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ResponseMessage
 */
export function isResponseMessage(message: WebviewMessage<any>): message is ResponseMessage {
  return message?.type === 'response';
}

/**
 * Type guard per verificare se un messaggio è un StateMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un StateMessage
 */
export function isStateMessage(message: WebviewMessage<any>): message is StateMessage {
  return message?.type === 'state';
}

/**
 * Type guard per verificare se un messaggio è un InstructionMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un InstructionMessage
 */
export function isInstructionMessage(message: WebviewMessage<any>): message is InstructionMessage {
  return (
    message?.type === WebviewMessageType.INSTRUCTION_RECEIVED ||
    message?.type === WebviewMessageType.INSTRUCTION_COMPLETED ||
    message?.type === WebviewMessageType.INSTRUCTION_FAILED
  );
}

/**
 * Type guard per verificare se un messaggio è un InstructionCompletedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un InstructionCompletedMessage
 */
export function isInstructionCompletedMessage(
  message: WebviewMessage<any>
): message is InstructionCompletedMessage {
  return message?.type === 'instructionCompleted';
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
  isAction: (d: any): d is ActionMessage => d?.type === 'action',
  isError: (d: any): d is ErrorMessage => d?.type === 'error',
  isResponse: (d: any): d is ResponseMessage => d?.type === 'response',
  isState: (d: any): d is StateMessage => d?.type === 'state',
};

/**
 * Verifica se un messaggio è un messaggio valido per la webview
 * @param message Messaggio da verificare
 * @param schema Schema di validazione
 * @returns true se il messaggio è valido
 */
export function isWebviewMessage(message: unknown, schema: ZodSchemaMap): boolean {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const msg = message as Record<string, unknown>;

  if (!msg.type || typeof msg.type !== 'string') {
    return false;
  }

  if (!msg.agentId || typeof msg.agentId !== 'string') {
    return false;
  }

  if (!msg.payload) {
    return false;
  }

  const schemaForType = schema[msg.type as string];
  if (!schemaForType) {
    return false;
  }

  return true;
}

export interface WebviewReadyMessage {
  type: WebviewMessageType.READY;
  timestamp?: number;
  payload?: Record<string, unknown>;
}

export interface WebviewErrorMessage {
  type: WebviewMessageType.ERROR;
  timestamp?: number;
  payload?: {
    error: string;
  };
}

export interface WebviewLogMessage {
  type: WebviewMessageType.LOG_EXPORT;
  timestamp?: number;
  payload?: {
    message: string;
  };
}

export interface WebviewStateUpdateMessage {
  type: WebviewMessageType.STATE_UPDATE;
  timestamp?: number;
  payload?: {
    state: Record<string, unknown>;
  };
}

export interface WebviewCommandMessage {
  type: WebviewMessageType.COMMAND;
  timestamp?: number;
  payload?: {
    command: string;
    args?: any[];
  };
}

export interface WebviewResponseMessage {
  type: WebviewMessageType.RESPONSE;
  timestamp?: number;
  payload?: {
    requestId: string;
    data?: any;
    error?: string;
  };
}

export type WebviewMessage =
  | WebviewReadyMessage
  | WebviewErrorMessage
  | WebviewLogMessage
  | WebviewStateUpdateMessage
  | WebviewCommandMessage
  | WebviewResponseMessage;

// Type guards
export const isWebviewReadyMessage = (message: WebviewMessage): message is WebviewReadyMessage =>
  message.type === WebviewMessageType.READY;

export const isWebviewErrorMessage = (message: WebviewMessage): message is WebviewErrorMessage =>
  message.type === WebviewMessageType.ERROR;

export const isWebviewLogMessage = (message: WebviewMessage): message is WebviewLogMessage =>
  message.type === WebviewMessageType.LOG_EXPORT;

export const isWebviewStateUpdateMessage = (
  message: WebviewMessage
): message is WebviewStateUpdateMessage => message.type === WebviewMessageType.STATE_UPDATE;

export const isWebviewCommandMessage = (
  message: WebviewMessage
): message is WebviewCommandMessage => message.type === WebviewMessageType.COMMAND;

export const isWebviewResponseMessage = (
  message: WebviewMessage
): message is WebviewResponseMessage => message.type === WebviewMessageType.RESPONSE;

export type BaseWebviewMessage<T extends string = string> = {
  type: T;
  agentId?: string;
  threadId?: string;
};

export type InstructionCompletedMessage = BaseWebviewMessage<'INSTRUCTION_COMPLETED'> & {
  payload: {
    output: string;
    tokens?: LLMStreamToken[];
  };
};

export type InstructionFailedMessage = BaseWebviewMessage<'INSTRUCTION_FAILED'> & {
  error: string;
};

export type AgentTypingMessage = BaseWebviewMessage<'AGENT_TYPING'>;
export type AgentTypingDoneMessage = BaseWebviewMessage<'AGENT_TYPING_DONE'>;

export type LlmCancelMessage = BaseWebviewMessage<'LLM_CANCEL'> & {
  payload: { requestId: string };
};

export type DisconnectMessage = BaseWebviewMessage<'DISCONNECT'>;

export type AgentTaskCreatedMessage = BaseWebviewMessage<'AGENT_TASK_CREATED'> & {
  payload: {
    taskId: string;
    description: string;
  };
};

export type AgentTaskDoneMessage = BaseWebviewMessage<'AGENT_TASK_DONE'> & {
  payload: {
    taskId: string;
    result: string;
  };
};

export type WebSocketErrorMessage = BaseWebviewMessage<'WS_ERROR'> & {
  error: string;
};

// Type Guards
export function isWebviewMessage<T extends WebviewMessageUnion>(msg: unknown): msg is T {
  return typeof (msg as any)?.type === 'string';
}

export function isAgentMessage(
  msg: WebviewMessageUnion
): msg is AgentTypingMessage | AgentTypingDoneMessage | InstructionCompletedMessage {
  return (
    msg.type.startsWith('AGENT_') ||
    msg.type === 'INSTRUCTION_COMPLETED' ||
    msg.type === 'INSTRUCTION_FAILED'
  );
}

export function isLlmCancelMessage(
  msg: WebviewMessageUnion
): msg is LlmCancelMessage {
  return msg.type === 'LLM_CANCEL';
}
