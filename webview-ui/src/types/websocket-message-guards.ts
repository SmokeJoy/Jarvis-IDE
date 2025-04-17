import { z } from 'zod';
import { PingMessageSchema, LlmStatusMessageSchema, WebSocketMessageUnion } from './websocket-message';

export const isWebSocketMessage = (message: unknown): message is WebSocketMessageUnion => {
  return typeof message === 'object' && message !== null && 'type' in message;
};

export const isPingMessage = (message: WebSocketMessageUnion): message is Extract<WebSocketMessageUnion, { type: 'WS_PING' }> => {
  return message.type === 'WS_PING' && PingMessageSchema.safeParse(message).success;
};

export const isLlmStatusMessage = (message: WebSocketMessageUnion): message is Extract<WebSocketMessageUnion, { type: 'WS_LLM_STATUS' }> => {
  return message.type === 'WS_LLM_STATUS' && LlmStatusMessageSchema.safeParse(message).success;
};

export const isErrorMessage = (message: WebSocketMessageUnion): message is Extract<WebSocketMessageUnion, { type: 'WS_ERROR' }> => {
  return message.type === 'WS_ERROR' && 'error' in message && 'code' in message;
};