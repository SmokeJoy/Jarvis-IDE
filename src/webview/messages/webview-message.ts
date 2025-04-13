// src/webview/messages/webview-message.ts
import { BaseMessage } from '../../shared/types/message';

export interface WebviewMessage<T extends string> {
  type: T;
  payload: unknown;
}

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
