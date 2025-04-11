import { z } from 'zod';
import { WebSocketMessageType, PingMessageSchema, LlmStatusMessageSchema, WebSocketMessageUnion } from './websocket-message';

export const isWebSocketMessage = (message: unknown): message is WebSocketMessageUnion => {
  return typeof message === 'object' && message !== null && 'type' in message;
};

export const isPingMessage = (message: WebSocketMessageUnion): message is Extract<WebSocketMessageUnion, { type: typeof WebSocketMessageType.PING }> => {
  return message.type === WebSocketMessageType.PING && PingMessageSchema.safeParse(message).success;
};

export const isLlmStatusMessage = (message: WebSocketMessageUnion): message is Extract<WebSocketMessageUnion, { type: typeof WebSocketMessageType.LLM_STATUS }> => {
  return message.type === WebSocketMessageType.LLM_STATUS && LlmStatusMessageSchema.safeParse(message).success;
};

export const isErrorMessage = (message: WebSocketMessageUnion): message is Extract<WebSocketMessageUnion, { type: typeof WebSocketMessageType.ERROR }> => {
  return message.type === WebSocketMessageType.ERROR && 'error' in message && 'code' in message;
};