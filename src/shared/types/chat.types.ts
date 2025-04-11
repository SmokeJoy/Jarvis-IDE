/**
 * @file chat.types.ts
 * @description Definizione centralizzata per tipi di contenuti multimodali nei messaggi chat
 * @version 1.0.0
 */

import { ChatSettings } from './user-settings.types.js';
import { 
  ChatCompletionContentPart,
  ChatCompletionContentPartText,
  ChatCompletionContentPartImage
} from './llm.types.js';

// Importazione della definizione principale di ChatMessage
import { ChatMessage } from './message.types.js';

export type { ChatSettings, ChatMessage };
export type { ChatCompletionContentPart, ChatCompletionContentPartText, ChatCompletionContentPartImage };

/**
 * Tipo di contenuto supportato nei messaggi multimodali
 */
export enum ContentType {
  Text = 'text',
  Image = 'image_url',
  ToolUse = 'tool_use',
  ToolResult = 'tool_result'
}

/**
 * Blocco di testo per un messaggio
 */
export interface TextBlock {
  type: ContentType.Text;
  text: string;
}

/**
 * Blocco immagine per un messaggio
 */
export interface ImageBlock {
  type: ContentType.Image;
  url?: string;
  base64Data?: string;
  media_type?: string;
}

/**
 * Blocco generico per uso di strumenti
 */
export interface ToolUseBlock {
  type: ContentType.ToolUse;
  id: string;
  name: string;
  input: Record<string, any>;
}

/**
 * Blocco generico per risultati di strumenti
 */
export interface ToolResultBlock {
  type: ContentType.ToolResult;
  toolUseId: string;
  content: string | Record<string, any>;
}

/**
 * Tipo unione per tutti i possibili blocchi di contenuto
 */
export type ContentBlock = 
  | TextBlock 
  | ImageBlock 
  | ToolUseBlock 
  | ToolResultBlock;

/**
 * Funzione di utility per normalizzare un messaggio
 * @deprecated Utilizzare la funzione equivalente in message.types.js
 */
export function normalizeMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    content: typeof message.content === 'string' 
      ? [{ type: ContentType.Text, text: message.content }] 
      : message.content,
    timestamp: message.timestamp || new Date().toISOString()
  };
} 