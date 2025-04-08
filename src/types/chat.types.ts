/**
 * @file chat.types.ts
 * @description Definizione centralizzata dei tipi per i messaggi di chat e contenuti multimodali in Jarvis IDE.
 * Questo file è la fonte di verità per tutti i tipi utilizzati nei trasformatori e nei provider.
 */

/**
 * Tipo di contenuto supportato nei messaggi
 */
export enum ContentType {
  Text = 'text',
  Image = 'image',
  ToolUse = 'tool_use',
  ToolResult = 'tool_result'
}

/**
 * Tipi discriminati unificati
 */
export type ContentBlock = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock;

export interface TextBlock {
  type: ContentType.Text;
  text: string;
}

export interface ImageBlock {
  type: ContentType.Image;
  url?: string;
  base64Data?: string;
  media_type?: string;
}

export interface ToolUseBlock {
  type: ContentType.ToolUse;
  tool_name: string;
  input: Record<string, unknown>;
  id?: string;
}

export interface ToolResultBlock {
  type: ContentType.ToolResult;
  tool_name: string;
  result: unknown;
  toolUseId?: string;
}

/**
 * Rappresenta un messaggio di chat standard utilizzato in tutti i provider.
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  content: ContentBlock[] | string;
  timestamp: string;
  name?: string;
  providerFields?: {
    model?: string;
    stopReason?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    internalReasoning?: string;
  };
}

/**
 * Utility types for specific content blocks
 */
export type TextContent = TextBlock;
export type ImageContent = ImageBlock;
export type ToolUseContent = ToolUseBlock;
export type ToolResultContent = ToolResultBlock;

/**
 * Verifica se un blocco è di tipo testo.
 * @param block - Blocco da verificare
 * @returns true se il blocco è di tipo testo
 */
export function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === ContentType.Text;
}

/**
 * Verifica se un blocco è di tipo immagine.
 * @param block - Blocco da verificare
 * @returns true se il blocco è di tipo immagine
 */
export function isImageBlock(block: ContentBlock): block is ImageBlock {
  return block.type === ContentType.Image;
}

/**
 * Verifica se un blocco è di tipo tool_use.
 * @param block - Blocco da verificare
 * @returns true se il blocco è di tipo tool_use
 */
export function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === ContentType.ToolUse;
}

/**
 * Verifica se un blocco è di tipo tool_result.
 * @param block - Blocco da verificare
 * @returns true se il blocco è di tipo tool_result
 */
export function isToolResultBlock(block: ContentBlock): block is ToolResultBlock {
  return block.type === ContentType.ToolResult;
}

/**
 * Helper function to convert simple string content to a content block array
 */
export function normalizeContent(content: string | ContentBlock[]): ContentBlock[] {
  if (typeof content === 'string') {
    return [{ type: ContentType.Text, text: content }];
  }
  return content;
}

/**
 * Helper function to convert content blocks to string (for simple rendering)
 */
export function contentBlocksToString(blocks: ContentBlock[]): string {
  return blocks
    .filter(isTextBlock)
    .map(block => block.text)
    .join('\n');
}

/**
 * Helper to normalize a full message
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

/**
 * Funzione utility per normalizzare un array di messaggi
 */
export function normalizeChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(normalizeMessage);
}

/**
 * Estrae il testo semplice da un messaggio, indipendentemente dal formato.
 * @param message - Messaggio da cui estrarre il testo
 * @returns Testo estratto
 */
export function extractTextFromMessage(message: ChatMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  } else if (Array.isArray(message.content)) {
    return message.content
      .filter(isTextBlock)
      .map(block => block.text)
      .join("\n");
  }
  return "";
}

/**
 * Crea un nuovo oggetto ChatMessage con i parametri specificati.
 * 
 * @param role Ruolo del messaggio
 * @param content Contenuto del messaggio
 * @param options Opzioni aggiuntive (nome, timestamp, providerFields)
 * @returns Nuovo oggetto ChatMessage
 */
export function createChatMessage(
  role: ChatMessage["role"],
  content: string | ContentBlock[],
  options?: { 
    name?: string; 
    timestamp?: string;
    providerFields?: Record<string, any>;
  }
): ChatMessage {
  return {
    role,
    content,
    name: options?.name,
    timestamp: options?.timestamp || new Date().toISOString(),
    providerFields: options?.providerFields
  };
} 