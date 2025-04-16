// src/webview/messages/webview-message.ts
import type { WebviewMessage as SharedWebviewMessage } from '../../shared/types/webview.types';
import type { BaseMessage } from '../../shared/types/common';

/**
 * Interfaccia base per i messaggi specifici di questo modulo.
 * NON estende BaseMessage direttamente, definisce solo la struttura minima locale.
 */
export interface WebviewMessage<T extends string> {
  type: T;
  payload: unknown;
}

/**
 * Messaggio di base per la comunicazione webview,
 * utilizzato come tipo base per messaggi specifici.
 */
export interface WebviewMessageTyped<T extends string> extends BaseMessage {
  type: T;
  payload?: Record<string, unknown>;
}

/**
 * Tipo generico per messaggi webview non ancora tipizzati.
 */
export type UntypedWebviewMessage = BaseMessage & {
  type: string;
  payload?: Record<string, unknown>;
};

export interface ResponseMessage extends WebviewMessage<'response'> {
  payload: BaseMessage;
}

export interface ChunkMessage extends WebviewMessage<'chunk'> {
  payload: string;
}

export interface ErrorMessage extends WebviewMessage<'error'> {
  payload: string;
}

export interface McpConnectionMessage extends WebviewMessage<'mcpConnected' | 'mcpDisconnected'> {
  payload: boolean;
}

export type WebviewMessageUnion =
  | ResponseMessage
  | ChunkMessage
  | ErrorMessage
  | McpConnectionMessage;

export function createWebviewMessage<T extends string>(
  type: T,
  payload: unknown
): WebviewMessage<T> {
  return { type, payload };
}
