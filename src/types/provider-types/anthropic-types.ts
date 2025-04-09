/**
 * @file anthropic-types.ts
 * @description Definizione dei tipi interni per l'API Anthropic, senza dipendenze esterne
 * @version 1.0.0 - File aggiornato secondo la struttura corrente del progetto
 */

/**
 * Messaggio nel formato Anthropic
 */
export interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | AnthropicContentBlock[];
}

/**
 * Blocco di contenuto nel formato Anthropic
 */
export type AnthropicContentBlock = 
  | AnthropicTextBlock 
  | AnthropicImageBlock 
  | AnthropicToolUseBlock 
  | AnthropicToolResultBlock;

/**
 * Blocco di testo
 */
export interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

/**
 * Blocco immagine
 */
export interface AnthropicImageBlock {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    media_type?: string;
    data?: string;
    url?: string;
  };
}

/**
 * Blocco per l'utilizzo di uno strumento
 */
export interface AnthropicToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Blocco per il risultato di uno strumento
 */
export interface AnthropicToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | any;
  is_error?: boolean;
}

/**
 * Opzioni per la richiesta di messaggio ad Anthropic
 */
export interface AnthropicMessageOptions {
  model: string;
  messages: AnthropicMessage[];
  temperature?: number;
  max_tokens?: number;
  system?: string;
  stream?: boolean;
  stop_sequences?: string[];
  tools?: AnthropicTool[];
}

/**
 * Definizione di uno strumento per Anthropic
 */
export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

/**
 * Chunk di streaming Anthropic
 */
export interface AnthropicStreamChunk {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  message?: Partial<AnthropicMessageResponse>;
  index?: number;
  content_block?: {
    type: 'text' | 'tool_use';
    text?: string;
    tool_use?: AnthropicToolUseBlock;
  };
  delta?: {
    type?: 'text_delta' | 'tool_use_delta';
    text?: string;
    tool_use?: Partial<AnthropicToolUseBlock>;
    stop_reason?: string;
    stop_sequence?: string;
  };
}

/**
 * Risposta di messaggio Anthropic
 */
export interface AnthropicMessageResponse {
  id: string;
  type: string;
  role: 'assistant';
  content: string | AnthropicContentBlock[];
  model: string;
  stop_reason?: string | null;
  stop_sequence?: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    input_characters?: number;
    output_characters?: number;
  };
} 