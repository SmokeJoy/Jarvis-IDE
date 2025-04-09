/**
 * @file BaseTransformer.ts
 * @description Definisce l'interfaccia base per i transformer che convertono messaggi tra formati
 */

import type { ChatMessage, ContentBlock, TextBlock, ImageBlock, ContentType, isTextBlock, isImageBlock } from '../../types/chat.types.js.js';
import type { OpenAIOptions, ChatCompletionOptions, ChatCompletionMessageParam, ChatCompletionChunk, Stream, ChatCompletion } from '../../types/provider-types/openai-types.js.js';
import type { AnthropicMessage, AnthropicMessageOptions, AnthropicStreamChunk, AnthropicMessageResponse } from '../../types/provider-types/anthropic-types.js.js';

/**
 * Interfaccia base per i transformer che convertono messaggi tra il formato standard dell'applicazione
 * e il formato specifico del provider LLM.
 */
export interface BaseTransformer<TOptions, TMessage, TChunk, TResponse> {
  /**
   * Converte un messaggio dal formato standard dell'applicazione al formato del provider LLM.
   * 
   * @param message Messaggio nel formato standard dell'applicazione
   * @returns Messaggio nel formato del provider LLM
   */
  toLLMMessages(messages: ChatMessage[]): TMessage[];

  /**
   * Crea l'oggetto opzioni di richiesta per il provider LLM.
   * 
   * @param options Opzioni di base per la richiesta
   * @param messages Messaggi già convertiti nel formato del provider
   * @returns Oggetto opzioni completo per la richiesta al provider
   */
  createRequestOptions(options: BaseRequestOptions, messages: TMessage[]): TOptions;

  /**
   * Estrae il testo da un chunk di risposta streaming.
   * 
   * @param chunk Chunk di risposta dal provider LLM
   * @returns Testo estratto dal chunk
   */
  extractTextFromChunk(chunk: TChunk): string | undefined;

  /**
   * Estrae il testo di ragionamento da un chunk di risposta streaming (se disponibile).
   * 
   * @param chunk Chunk di risposta dal provider LLM
   * @returns Testo di ragionamento estratto dal chunk, se presente
   */
  extractReasoningFromChunk?(chunk: TChunk): string | undefined;

  /**
   * Estrae le informazioni di utilizzo token da un chunk di risposta o risposta completa.
   * 
   * @param response Risposta o chunk dal provider LLM
   * @returns Informazioni sui token utilizzati
   */
  extractTokenUsage?(response: TResponse | TChunk): TokenUsage | undefined;

  /**
   * Converte una risposta completa dal provider LLM al formato standard dell'applicazione.
   * 
   * @param response Risposta completa dal provider LLM
   * @returns Messaggio nel formato standard dell'applicazione
   */
  fromLLMResponse?(response: TResponse): ChatMessage;
}

/**
 * Opzioni base per le richieste ai provider LLM.
 */
export interface BaseRequestOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  functions?: any[];
  systemPrompt?: string;
}

/**
 * Informazioni sull'utilizzo dei token.
 */
export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/**
 * Classe di trasformazione per provider OpenAI.
 */
export type OpenAITransformerType = BaseTransformer<
  ChatCompletionOptions,
  ChatCompletionMessageParam,
  ChatCompletionChunk,
  ChatCompletion
>;

/**
 * Classe di trasformazione per provider Anthropic.
 */
export type AnthropicTransformerType = BaseTransformer<
  AnthropicMessageOptions,
  AnthropicMessage,
  AnthropicStreamChunk,
  AnthropicMessageResponse
>;

/**
 * Utilità per lavorare con i content block multimodali.
 */
export const ContentUtils = {
  /**
   * Estrae il testo da un array di parti di contenuto.
   * 
   * @param content Array di parti di contenuto
   * @returns Testo estratto dalle parti di tipo testo
   */
  getTextFromContent(content: ContentBlock[]): string {
    if (!content || !Array.isArray(content)) return '';
    
    return content
      .filter(isTextBlock)
      .map(part => part.text)
      .join('');
  },

  /**
   * Estrae le immagini da un array di parti di contenuto.
   * 
   * @param content Array di parti di contenuto
   * @returns Array di parti di contenuto di tipo immagine
   */
  getImagesFromContent(content: ContentBlock[]): ImageBlock[] {
    if (!content || !Array.isArray(content)) return [];
    
    return content.filter(isImageBlock);
  }
}; 