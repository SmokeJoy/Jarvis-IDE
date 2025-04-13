import { ChatCompletionMessageParam } from '../../types/provider-types/openai-types';
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export interface BaseMessage {
  role: MessageRole;
  content:
    | string
    | Array<{
        type: 'text' | 'image';
        text?: string;
        url?: string;
      }>;
  timestamp: number;
  streaming?: boolean;
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
//# sourceMappingURL=message.d.ts.map
