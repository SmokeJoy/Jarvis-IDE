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
export enum ContentType {
  Text = 'text',
  Image = 'image_url',
  ToolUse = 'tool_use',
  ToolResult = 'tool_result',
}

/**
 * Blocco di testo per un messaggio
 */
export type TextBlock = {
  type: ContentType.Text;
  text: string;
};

/**
 * Blocco immagine per un messaggio
 */
export type ImageBlock = {
  type: ContentType.Image;
  image_url: string;
  alt?: string;
};

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
export type ToolUseBlock = {
  type: ContentType.ToolUse;
  toolName: string;
  input: unknown;
};

/**
 * Blocco generico per risultati di strumenti
 */
export type ToolResultBlock = {
  type: ContentType.ToolResult;
  toolName: string;
  result: unknown;
};

/**
 * Tipo unione per tutti i possibili blocchi di contenuto
 */
export type ContentBlock =
  | TextBlock
  | ImageBlock
  | ToolUseBlock
  | ToolResultBlock;

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string | ContentBlock[];
  name?: string;
  timestamp?: number;
  streaming?: boolean;
  providerFields?: Record<string, unknown>;
}

/**
 * Creates a standard ChatMessage object.
 * Ensures required fields and defaults.
 *
 * @param message Partial message data
 * @returns A validated ChatMessage object
 */
export function createChatMessage(message: Partial<ChatMessage> & Pick<ChatMessage, 'role' | 'content'>): ChatMessage {
  if (!message.id) {
    // Simple unique ID generation for client-side messages
    message.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  if (!message.timestamp) {
    message.timestamp = Date.now();
  }
  // Ensure content is not empty or just whitespace if it's a string
  if (typeof message.content === 'string' && !message.content.trim()) {
    throw new Error('ChatMessage content cannot be empty or just whitespace.');
  }
  // Ensure content array is not empty if it's an array
  if (Array.isArray(message.content) && message.content.length === 0) {
    throw new Error('ChatMessage content array cannot be empty.');
  }

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    name: message.name,
    timestamp: message.timestamp,
    streaming: message.streaming ?? false,
    providerFields: message.providerFields,
  };
}

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

/**
 * Tipi per la chat
 */

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  streaming?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ChatHistory {
  messages: ChatMessage[];
  lastUpdated: number;
}

export interface ChatExportOptions {
  format: 'markdown' | 'json' | 'txt';
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  error?: string;
}
