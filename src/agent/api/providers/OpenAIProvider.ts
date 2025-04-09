/**
 * @file OpenAIProvider.ts
 * @description Provider per l'API OpenAI
 */

import OpenAI from 'openai';
import type { ChatMessage } from '../../../types/chat.types.js.js';
import type { ApiProvider, StreamHandler } from '../ApiProvider.js.js';
import type { normalizeChatMessages } from '../../../types/chat.types.js.js';
import * as OpenAITransformer from '../../../api/transform/openai-format.js.js';
import { logger } from '../../../utils/logger.js.js';
import type { OpenAIOptions, ChatCompletionOptions } from '../../../types/provider-types/openai-types.js.js';

/**
 * Provider per l'API OpenAI
 */
export class OpenAIProvider implements ApiProvider {
  private client: OpenAI;
  private options: {
    apiKey: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    organization?: string;
  };

  /**
   * Crea una nuova istanza del provider OpenAI
   * 
   * @param options Opzioni di configurazione
   */
  constructor(options: {
    apiKey: string;
    baseUrl?: string;
    maxTokens?: number;
    temperature?: number;
    organization?: string;
  }) {
    this.options = options;
    
    const clientOptions: OpenAIOptions = {
      apiKey: options.apiKey,
      organization: options.organization
    };
    
    if (options.baseUrl) {
      clientOptions.baseURL = options.baseUrl;
    }
    
    this.client = new OpenAI(clientOptions);
  }

  /**
   * Invia una richiesta a OpenAI con streaming
   * 
   * @param messages Messaggi da inviare
   * @param options Opzioni per la richiesta
   * @param handler Handler per gestire i chunk di risposta
   */
  async sendWithStreaming(
    messages: any[],
    options: {
      model: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      functions?: any[];
    },
    handler: StreamHandler
  ): Promise<void> {
    try {
      // Normalizza i messaggi al formato standard
      const normalizedMessages = normalizeChatMessages(messages);
      
      // Converti i messaggi nel formato OpenAI
      const openaiMessages = OpenAITransformer.toLLMMessages(normalizedMessages);
      
      // Prepara le opzioni di richiesta
      const requestOptions = OpenAITransformer.createRequestOptions(
        {
          model: options.model,
          temperature: options.temperature ?? this.options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? this.options.maxTokens,
          stream: true,
          systemPrompt: options.systemPrompt,
          functions: options.functions
        },
        openaiMessages
      );
      
      // Invia la richiesta
      const stream = await this.client.chat.completions.create(requestOptions);
      
      // Processa lo stream
      let accumulatedText = '';
      
      for await (const chunk of stream) {
        // Estrai il testo dal chunk
        const textChunk = OpenAITransformer.extractTextFromChunk(chunk);
        
        if (textChunk) {
          accumulatedText += textChunk;
          handler.onTextChunk(textChunk);
        }
        
        // Estrai info di reasoning se presenti
        const reasoningChunk = OpenAITransformer.extractReasoningFromChunk(chunk);
        if (reasoningChunk) {
          handler.onReasoningChunk?.(reasoningChunk);
        }
        
        // Estrai usage se presente
        const usage = OpenAITransformer.extractTokenUsage(chunk);
        if (usage) {
          handler.onUsage?.(usage.promptTokens || 0, usage.completionTokens || 0);
        }
      }
      
      // Notifica il completamento
      handler.onComplete(accumulatedText);
      
    } catch (error) {
      logger.error(`OpenAIProvider streaming error: ${error.message}`);
      handler.onError(error.message || "Errore durante lo streaming con OpenAI");
    }
  }

  /**
   * Invia una richiesta a OpenAI e attende la risposta
   * 
   * @param messages Messaggi da inviare
   * @param options Opzioni per la richiesta
   * @returns Risposta completa come stringa
   */
  async send(
    messages: any[],
    options: {
      model: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      functions?: any[];
    }
  ): Promise<string> {
    try {
      // Normalizza i messaggi al formato standard
      const normalizedMessages = normalizeChatMessages(messages);
      
      // Converti i messaggi nel formato OpenAI
      const openaiMessages = OpenAITransformer.toLLMMessages(normalizedMessages);
      
      // Prepara le opzioni di richiesta
      const requestOptions = OpenAITransformer.createRequestOptions(
        {
          model: options.model,
          temperature: options.temperature ?? this.options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? this.options.maxTokens,
          stream: false,
          systemPrompt: options.systemPrompt,
          functions: options.functions
        },
        openaiMessages
      );
      
      // Invia la richiesta
      const response = await this.client.chat.completions.create(requestOptions);
      
      // Converti la risposta in testo
      return response.choices[0].message.content || '';
      
    } catch (error) {
      logger.error(`OpenAIProvider error: ${error.message}`);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
} 