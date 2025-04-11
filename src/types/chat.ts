import type { ChatCompletionMessageParam } from "./provider-types/openai-types.js";

export interface Message extends ChatCompletionMessageParam {
  timestamp: number;
  streaming?: boolean;
}

export interface WebviewMessage {
  type: string;
  payload?: any;
}

export interface ChatRequest {
  messages: Message[];
  stream?: boolean;
}

export interface ChatResponse {
  message: Message;
  error?: string;
}

export interface StreamResponse {
  chunk: string;
  error?: string;
}

export interface ErrorResponse {
  error: string;
} 