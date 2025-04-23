import { z } from 'zod';
/**
 * @file websocketMessageUnion.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi WebSocket
 * @version 2.0.0
 */

import { BaseMessage } from './message-utils';

/**
 * Enum per i tipi di messaggi WebSocket
 * @deprecated Da sostituire con string literals nei nuovi tipi
 */
export enum WebSocketMessageType {
  WS_PING = 'ws.ping',
  WS_PONG = 'ws.pong',
  WS_ERROR = 'ws.error',
  DISCONNECT = 'ws.disconnect',
  WS_LLM_STATUS = 'ws.llm/status',
  WS_CANCEL = 'ws.llm/cancel',
}

/**
 * Messaggio di ping con timestamp
 */
export type PingMessage = BaseMessage<
  'ws.ping',
  { timestamp: number }
>;

/**
 * Messaggio di pong con timestamp
 */
export type PongMessage = BaseMessage<
  'ws.pong',
  { timestamp: number }
>;

/**
 * Messaggio di errore WebSocket
 */
export type WebSocketErrorMessage = BaseMessage<
  'ws.error',
  { error: string; code: number }
>;

/**
 * Messaggio di disconnessione
 */
export type DisconnectMessage = BaseMessage<
  'ws.disconnect'
>;

/**
 * Messaggio di stato del modello LLM
 */
export type LlmStatusMessage = BaseMessage<
  'ws.llm/status',
  {
    modelId: string;
    status: 'loading' | 'ready' | 'error';
    timestamp: number;
  }
>;

/**
 * Messaggio di cancellazione richiesta LLM
 */
export type LlmCancelMessage = BaseMessage<
  'ws.llm/cancel',
  { requestId: string }
>;

/**
 * Unione discriminata di tutti i tipi di messaggi WebSocket
 */
export type WebSocketMessageUnion =
  | PingMessage
  | PongMessage
  | WebSocketErrorMessage
  | DisconnectMessage
  | LlmStatusMessage
  | LlmCancelMessage;

/**
 * Type guard per verificare se un messaggio è un messaggio WebSocket
 */
export function isWebSocketMessage(msg: unknown): msg is WebSocketMessageUnion {
  if (typeof msg !== 'object' || msg === null || !('type' in msg)) {
    return false;
  }
  
  const type = (msg as { type: string }).type;
  
  return (
    type === 'ws.ping' ||
    type === 'ws.pong' ||
    type === 'ws.error' ||
    type === 'ws.disconnect' ||
    type === 'ws.llm/status' ||
    type === 'ws.llm/cancel'
  );
}

/**
 * Type guards specifiche per ogni tipo di messaggio WebSocket
 */
export function isPingMessage(msg: unknown): msg is PingMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'ws.ping';
}

export function isPongMessage(msg: unknown): msg is PongMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'ws.pong';
}

export function isWebSocketErrorMessage(msg: unknown): msg is WebSocketErrorMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'ws.error';
}

export function isDisconnectMessage(msg: unknown): msg is DisconnectMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'ws.disconnect';
}

export function isLlmStatusMessage(msg: unknown): msg is LlmStatusMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'ws.llm/status';
}

export function isLlmCancelMessage(msg: unknown): msg is LlmCancelMessage {
  return typeof msg === 'object' && msg !== null && (msg as any).type === 'ws.llm/cancel';
}