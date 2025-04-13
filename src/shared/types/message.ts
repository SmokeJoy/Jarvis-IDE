/**
 * @file message.ts
 * @description Esportazione centralizzata dei tipi per i messaggi di chat
 */

export * from './message.types';
export * from './message-adapter';

// Tipo per i ruoli dei messaggi
export type MessageRole = 'user' | 'assistant' | 'system' | 'function' | 'tool';

// Tipo di base per i messaggi di chat condivisi
export interface BaseMessage {
  role: MessageRole;
  content: string;
}

export interface ChatCompletionMessageParam {
  role: string;
  content: string;
}

export interface ChatMessage extends ChatCompletionMessageParam {
  timestamp: number;
  streaming?: boolean;
}

export interface WebviewMessage {
  type: string;
  payload?: unknown;
}

/**
 * Payload di messaggio di chat
 */
export interface MessagePayload {
  messages: ChatCompletionMessageParam[];
  functions?: Function[];
  function_call?: FunctionCall;
}

/**
 * Definizione di una funzione chiamabile dall'LLM
 */
export interface Function {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Specifica una chiamata di funzione
 */
export interface FunctionCall {
  name: string;
  arguments?: string;
}

/**
 * Specifica un parametro di messaggio di chat completo
 */
export type MessageParam = ChatCompletionMessageParam;

/**
 * Array di messaggi di chat
 */
export type Messages = ChatCompletionMessageParam[];
