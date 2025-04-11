/**
 * @file anthropic-format.ts
 * @description Transformer per il formato Anthropic
 */

import { ChatMessage, ContentPart, ContentType, TextContent, ImageContent, ToolUseContent, ToolResultContent } from '../../types/chat.types.js';
import { AnthropicMessage, AnthropicMessageOptions, AnthropicStreamChunk, AnthropicMessageResponse, AnthropicTextBlock, AnthropicImageBlock, AnthropicToolUseBlock, AnthropicToolResultBlock, AnthropicContentBlock, AnthropicURLImageSource, AnthropicBase64ImageSource } from '../../types/provider-types/anthropic-types.js';
import { BaseTransformer, TokenUsage, BaseRequestOptions, ContentUtils } from './BaseTransformer.js';
import { logger } from '../../utils/logger.js';

/**
 * Transformer per convertire tra il formato ChatMessage standard e il formato Anthropic
 */
export class AnthropicTransformer implements BaseTransformer<AnthropicMessageOptions, AnthropicMessage, AnthropicStreamChunk, AnthropicMessageResponse> {
  /**
   * Converte messaggi da formato standard a formato Anthropic
   * 
   * @param messages Array di messaggi in formato standard
   * @returns Array di messaggi nel formato Anthropic
   */
  toLLMMessages(messages: ChatMessage[]): AnthropicMessage[] {
    return messages.map(message => {
      // Mappa ruoli da ChatMessage a Anthropic (Anthropic supporta solo "user" e "assistant")
      let role: 'user' | 'assistant';
      if (message.role === 'system') {
        // System message è gestito separatamente nelle opzioni di richiesta
        // Per ora trattiamolo come user message
        role = 'user';
      } else if (message.role === 'assistant' || message.role === 'user') {
        role = message.role;
      } else {
        // Default fallback
        logger.warn(`Ruolo non supportato da Anthropic: ${message.role}, convertito a 'user'`);
        role = 'user';
      }
      
      // Gestisci diversi formati di contenuto
      let content: string | AnthropicContentBlock[];
      
      if (typeof message.content === 'string') {
        // Se è una stringa, creiamo un singolo text block
        content = [{ type: 'text', text: message.content }];
      } else if (Array.isArray(message.content)) {
        // Se è un array di ContentPart, convertiamo ogni parte nel formato Anthropic
        content = (message.content as any[]).map(part => {
          if (part.type === ContentType.Text) {
            // Converti parte testuale
            return {
              type: 'text',
              text: (part as TextContent).text
            } as AnthropicTextBlock;
          } else if (part.type === ContentType.Image) {
            // Converti parte immagine
            const imageContent = part as ImageContent;
            
            if (imageContent.source.type === 'base64') {
              return {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageContent.source.media_type || 'image/jpeg',
                  data: imageContent.source.data
                } as AnthropicBase64ImageSource
              } as AnthropicImageBlock;
            } else {
              return {
                type: 'image',
                source: {
                  type: 'url',
                  url: imageContent.source.url
                } as AnthropicURLImageSource
              } as AnthropicImageBlock;
            }
          } else if (part.type === ContentType.ToolUse) {
            // Converti parte tool use
            const toolUseContent = part as ToolUseContent;
            return {
              type: 'tool_use',
              id: toolUseContent.id,
              name: toolUseContent.name,
              input: toolUseContent.input
            } as AnthropicToolUseBlock;
          } else if (part.type === ContentType.ToolResult) {
            // Converti parte tool result
            const toolResultContent = part as ToolResultContent;
            return {
              type: 'tool_result',
              tool_use_id: toolResultContent.tool_use_id,
              content: toolResultContent.content,
              is_error: toolResultContent.is_error
            } as AnthropicToolResultBlock;
          }
          
          // Fallback per tipi non supportati
          logger.warn(`Tipo di contenuto non supportato da Anthropic: ${(part as any).type}`);
          return {
            type: 'text',
            text: '[Contenuto non supportato]'
          } as AnthropicTextBlock;
        });
      } else {
        // Fallback per contenuto non valido
        content = [{ type: 'text', text: '[Contenuto non valido]' }];
      }
      
      return {
        role,
        content
      } as AnthropicMessage;
    });
  }
  
  /**
   * Crea le opzioni di richiesta per Anthropic
   * 
   * @param options Opzioni di base
   * @param messages Messaggi già convertiti nel formato Anthropic
   * @returns Opzioni di richiesta complete per Anthropic
   */
  createRequestOptions(options: BaseRequestOptions, messages: AnthropicMessage[]): AnthropicMessageOptions {
    const anthropicOptions: AnthropicMessageOptions = {
      model: options.model,
      messages: messages,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
      stream: options.stream || false
    };
    
    // Aggiungi systemPrompt se fornito
    if (options.systemPrompt && options.systemPrompt.trim() !== '') {
      anthropicOptions.system = options.systemPrompt;
    }
    
    // Aggiungi funzioni/strumenti se forniti
    if (options.functions && options.functions.length > 0) {
      anthropicOptions.tools = options.functions.map(func => ({
        name: func.name,
        description: func.description,
        input_schema: func.parameters
      }));
    }
    
    return anthropicOptions;
  }
  
  /**
   * Estrae il testo da un chunk di risposta streaming
   * 
   * @param chunk Chunk di risposta streaming di Anthropic
   * @returns Testo estratto dal chunk
   */
  extractTextFromChunk(chunk: AnthropicStreamChunk): string | undefined {
    // Gestisci il caso della delta nel testo
    if (chunk.type === 'content_block_delta' && chunk.delta && chunk.delta.type === 'text') {
      return chunk.delta.text;
    }
    
    // Gestisci il caso di un content block completo
    if (chunk.type === 'content_block_start' && chunk.content_block && chunk.content_block.type === 'text') {
      return chunk.content_block.text;
    }
    
    // Gestisci il caso di delta con tipo non text (può accadere in alcuni casi)
    if (chunk.type === 'message_delta') {
      // Accesso sicuro ai campi annidati
      const delta = chunk.delta as any;
      
      // Se il delta contiene direttamente del testo
      if (delta && delta.text) {
        return delta.text;
      }
      
      // Se il delta contiene un array di contenuti, cerca blocci di testo
      if (delta && Array.isArray(delta.content)) {
        // Estrai il testo dai blocchi di tipo text
        const textBlocks = delta.content.filter((block: any) => block.type === 'text');
        if (textBlocks.length > 0) {
          return textBlocks.map((block: any) => block.text).join('');
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Estrae il testo di ragionamento da un chunk di risposta streaming (non implementato per Anthropic)
   * 
   * @param chunk Chunk di risposta streaming di Anthropic
   * @returns Testo di ragionamento estratto dal chunk (undefined per Anthropic che non supporta reasoning_content)
   */
  extractReasoningFromChunk(chunk: AnthropicStreamChunk): string | undefined {
    // Anthropic non supporta nativamente il concetto di "reasoning" separato dal contenuto
    return undefined;
  }
  
  /**
   * Estrae informazioni di utilizzo token
   * 
   * @param response Risposta completa di Anthropic
   * @returns Informazioni su utilizzo token
   */
  extractTokenUsage(response: AnthropicMessageResponse): TokenUsage | undefined {
    if (!response || !response.usage) {
      return undefined;
    }
    
    return {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens
    };
  }
  
  /**
   * Converte una risposta completa di Anthropic in un messaggio standardizzato
   * 
   * @param response Risposta completa di Anthropic
   * @returns Messaggio in formato standard
   */
  fromLLMResponse(response: AnthropicMessageResponse): ChatMessage {
    if (!response || !response.content || !Array.isArray(response.content)) {
      return {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      };
    }
    
    // Converti i content block Anthropic in ContentPart
    const contentParts = response.content.map(block => {
      if (block.type === 'text') {
        return {
          type: ContentType.Text,
          text: block.text
        } as TextContent;
      } else if (block.type === 'image') {
        // Gestisci in modo diverso i tipi di sorgente immagine
        const imageSource = block.source;
        
        if (imageSource.type === 'base64') {
          return {
            type: ContentType.Image,
            source: {
              type: 'base64',
              media_type: imageSource.media_type || 'image/jpeg',
              data: imageSource.data || ''
            }
          } as ImageContent;
        } else {
          return {
            type: ContentType.Image,
            source: {
              type: 'url',
              url: (imageSource as AnthropicURLImageSource).url || ''
            }
          } as ImageContent;
        }
      } else if (block.type === 'tool_use') {
        return {
          type: ContentType.ToolUse,
          id: block.id,
          name: block.name,
          input: block.input
        } as ToolUseContent;
      } else if (block.type === 'tool_result') {
        return {
          type: ContentType.ToolResult,
          tool_use_id: block.tool_use_id,
          content: block.content,
          is_error: block.is_error
        } as ToolResultContent;
      }
      
      // Fallback per tipi sconosciuti
      logger.warn(`Tipo di content block Anthropic non supportato: ${block.type}`);
      return {
        type: ContentType.Text,
        text: '[Contenuto non supportato]'
      } as TextContent;
    });
    
    // Estrai informazioni di utilizzo token
    const tokenUsage = this.extractTokenUsage(response);
    
    // Crea l'oggetto ChatMessage
    return {
      role: 'assistant',
      content: contentParts,
      timestamp: new Date().toISOString(),
      providerFields: {
        id: response.id,
        model: response.model,
        stopReason: response.stop_reason,
        usage: tokenUsage,
        internalReasoning: "Claude non fornisce un ragionamento separato"
      }
    };
  }
}

// Crea un'istanza ed esporta metodi per compatibilità con chiamate statiche precedenti
const transformer = new AnthropicTransformer();
export const toLLMMessages = transformer.toLLMMessages.bind(transformer);
export const createRequestOptions = transformer.createRequestOptions.bind(transformer);
export const extractTextFromChunk = transformer.extractTextFromChunk.bind(transformer);
export const extractReasoningFromChunk = transformer.extractReasoningFromChunk.bind(transformer);
export const extractTokenUsage = transformer.extractTokenUsage.bind(transformer);
export const fromLLMResponse = transformer.fromLLMResponse.bind(transformer); 