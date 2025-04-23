/**
 * @file webviewMessageUnion.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi WebView
 * @version 1.0.0
 */

import {
  WebviewMessageType,
  SendPromptMessage,
  ActionMessage,
  ErrorMessage,
  ResponseMessage,
  StateMessage,
  InstructionMessage,
} from './webview.types';

import { ZodSchemaMap } from '../../utils/validation';
import type { LLMStreamToken } from './llm.types';
import type { ExtensionMessage } from './extensionMessageUnion';

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
  | InstructionMessage;

/**
 * Type guard per verificare se un messaggio è un SendPromptMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SendPromptMessage
 */
export function isSendPromptMessage(message: unknown): message is SendPromptMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as { type?: string }).type === WebviewMessageType.SEND_PROMPT
  );
}

/**
 * Type guard per verificare se un messaggio è un ActionMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ActionMessage
 */
export function isActionMessage(message: unknown): message is ActionMessage {
  return typeof message === 'object' && message !== null && (message as { type?: string }).type === 'action';
}

/**
 * Type guard per verificare se un messaggio è un ErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ErrorMessage
 */
export function isErrorMessage(message: unknown): message is ErrorMessage {
  return typeof message === 'object' && message !== null && (message as { type?: string }).type === 'error';
}

/**
 * Type guard per verificare se un messaggio è un ResponseMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ResponseMessage
 */
export function isResponseMessage(message: unknown): message is ResponseMessage {
  return (
    typeof message === 'object' && message !== null && (message as { type?: string }).type === 'response'
  );
}

/**
 * Type guard per verificare se un messaggio è un StateMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un StateMessage
 */
export function isStateMessage(message: unknown): message is StateMessage {
  return typeof message === 'object' && message !== null && (message as { type?: string }).type === 'state';
}

/**
 * Type guard per verificare se un messaggio è un InstructionMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un InstructionMessage
 */
export function isInstructionMessage(message: unknown): message is InstructionMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as { type?: string }).type === WebviewMessageType.INSTRUCTION
  );
}

/**
 * Versione migliorata di castAs che include un validatore opzionale
 * @param value Il valore da convertire
 * @param validator Funzione di validazione opzionale
 * @returns Il valore convertito al tipo T o null se la validazione fallisce
 */
export function safeCastAs<T>(value: unknown, validator?: (val: unknown) => boolean): T | null {
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
  isSendPrompt: (d: unknown): d is SendPromptMessage => isSendPromptMessage(d),
  isAction: (d: unknown): d is ActionMessage => isActionMessage(d),
  isError: (d: unknown): d is ErrorMessage => isErrorMessage(d),
  isResponse: (d: unknown): d is ResponseMessage => isResponseMessage(d),
  isState: (d: unknown): d is StateMessage => isStateMessage(d),
};

/**
 * Verifica se un messaggio è un messaggio valido per la webview
 * @param message Messaggio da verificare
 * @param schema Schema di validazione
 * @returns true se il messaggio è valido
 */
export function isWebviewMessageBySchema(message: unknown, schema: ZodSchemaMap): boolean {
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

  if (!(msg.payload as unknown)) {
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
export function isWebviewMessage(msg: unknown): msg is WebviewMessageUnion {
  if (typeof msg !== 'object' || msg === null) return false;
  const typeVal = (msg as { type?: string }).type;
  return (
    typeVal === WebviewMessageType.SEND_PROMPT ||
    typeVal === 'action' ||
    typeVal === 'error' ||
    typeVal === 'response' ||
    typeVal === 'state' ||
    typeVal === WebviewMessageType.INSTRUCTION
  );
}

export type UnifiedWebviewMessageUnion = WebviewMessageUnion | ExtensionMessage;

// Duplicated utility renamed per #contextPromptManager test fix
export const isUnifiedWebviewMessage = (
  message: unknown
): message is UnifiedWebviewMessageUnion =>
  typeof message === 'object' && message !== null && 'type' in (message as { type?: string });

// --- WebSocket Message Types ---
// export enum WebSocketMessageType {
//   PING = 'WS_PING',
//   PONG = 'WS_PONG',
//   LLM_STATUS = 'WS_LLM_STATUS',
//   ERROR = 'WS_ERROR',
//   DISCONNECT = 'WS_DISCONNECT',
//   CANCEL = 'WS_CANCEL',
// }

// Duplicate legacy exports commented out (migrate to earlier declarations)
// export type PingMessage = WebviewMessage<'WS_PING', { timestamp: number }>;
// export type PongMessage = WebviewMessage<'WS_PONG', { timestamp: number }>;
// export type LlmStatusMessage = WebviewMessage<'WS_LLM_STATUS', { modelId: string; status: 'loading' | 'ready' | 'error'; timestamp: number }>;
// export type WebSocketErrorMessage = WebviewMessage<'WS_ERROR', { error: string; code: number }>;
// export type DisconnectMessage = WebviewMessage<'WS_DISCONNECT', { reason?: string }>;
// export type LlmCancelMessage = WebviewMessage<'WS_CANCEL', { requestId: string }>;
