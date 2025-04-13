/**
 * @file chat.types.ts
 * @description Definizione centralizzata per tipi di contenuti multimodali nei messaggi chat
 * @version 1.0.0
 */

import type { ChatSettings } from './user-settings.types';
import type {
  ChatCompletionContentPart,
  ChatCompletionContentPartText,
  ChatCompletionContentPartImage,
} from './llm.types';
import type { ChatMessage, ChatRole } from './message.types';

// Re-export types
export type { 
  ChatSettings, 
  ChatMessage, 
  ChatRole,
  ChatCompletionContentPart,
  ChatCompletionContentPartText,
  ChatCompletionContentPartImage,
};

/**
 * Tipo di contenuto supportato nei messaggi multimodali
 */
export const enum ContentType {
  Text = 'text',
  Image = 'image_url',
  ToolUse = 'tool_use',
  ToolResult = 'tool_result',
}

/**
 * Blocco di testo per un messaggio
 */
export interface TextBlock {
  readonly type: ContentType.Text;
  text: string;
}

/**
 * Blocco immagine per un messaggio
 */
export interface ImageBlock {
  readonly type: ContentType.Image;
  url?: string;
  base64Data?: string;
  media_type?: string;
}

/**
 * Tipo per gli input degli strumenti
 * @remarks Garantisce che i valori siano di tipo primitivo o null
 */
export type ToolInput = {
  [key: string]: string | number | boolean | null;
};

/**
 * Tipo per i risultati degli strumenti
 * @remarks Garantisce che i valori siano di tipo unknown per type safety
 */
export type ToolResult = string | {
  [key: string]: unknown;
};

/**
 * Blocco generico per uso di strumenti
 */
export interface ToolUseBlock {
  readonly type: ContentType.ToolUse;
  readonly id: string;
  readonly name: string;
  input: ToolInput;
}

/**
 * Blocco generico per risultati di strumenti
 */
export interface ToolResultBlock {
  readonly type: ContentType.ToolResult;
  readonly toolUseId: string;
  content: ToolResult;
}

/**
 * Tipo unione per tutti i possibili blocchi di contenuto
 */
export type ContentBlock = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock;

/**
 * @deprecated Use the equivalent function in message.types.ts
 * @todo(TypescriptAI) Replace with a typed version that supports all content types
 */
export function normalizeMessage(message: ChatMessage): ChatMessage {
  if (!message.content) {
    throw new TypeError('Message content cannot be null or undefined');
  }

  return {
    ...message,
    content: Array.isArray(message.content)
      ? message.content
      : [{ type: ContentType.Text, text: String(message.content) }],
    timestamp: message.timestamp || new Date().toISOString(),
  };
}
