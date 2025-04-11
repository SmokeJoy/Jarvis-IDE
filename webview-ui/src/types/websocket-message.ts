import { z } from 'zod';

export const WebSocketMessageType = {
  PING: 'WS_PING',
  PONG: 'WS_PONG',
  LLM_STATUS: 'WS_LLM_STATUS',
  ERROR: 'WS_ERROR'
} as const;

export type WebSocketMessageType = typeof WebSocketMessageType[keyof typeof WebSocketMessageType];

export const PingMessageSchema = z.object({
  timestamp: z.number()
});
export type PingMessage = z.infer<typeof PingMessageSchema> & { type: typeof WebSocketMessageType.PING };

export const LlmStatusMessageSchema = z.object({
  modelId: z.string(),
  status: z.enum(['loading', 'ready', 'error']),
  timestamp: z.number()
});
export type LlmStatusMessage = z.infer<typeof LlmStatusMessageSchema> & { type: typeof WebSocketMessageType.LLM_STATUS };

export type WebSocketMessageUnion = 
  | PingMessage
  | LlmStatusMessage
  | { type: typeof WebSocketMessageType.PONG; payload: z.infer<typeof PingMessageSchema> }
  | { type: typeof WebSocketMessageType.ERROR; error: string; code: number };