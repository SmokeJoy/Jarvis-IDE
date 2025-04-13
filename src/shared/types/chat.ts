import { BaseMessage, ChatMessage } from './message';

export type { BaseMessage, ChatMessage };

export interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  error?: string;
}

export interface StreamResponse {
  chunk: string;
  error?: string;
}

export interface ErrorResponse {
  error: string;
}
