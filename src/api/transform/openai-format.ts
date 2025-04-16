/**
 * @file openai-format.ts
 * @description Transformer per il formato OpenAI
 */

import type {
  ChatCompletionMessageParam,
  ChatCompletionContentPartText,
  ChatCompletionContentPartImage,
} from 'openai/resources';
import {
  ChatMessage,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ContentType,
  isTextBlock,
  isImageBlock,
  createChatMessage,
} from '../../src/shared/types/chat.types';
import type { OpenAIOptions, ChatCompletionOptions, ChatCompletionChunk, ChatCompletion } from 'openai/resources';
import { BaseTransformer, TokenUsage, BaseRequestOptions } from './BaseTransformer';
import { logger } from '../../utils/logger';

/**
 * Transformer per convertire tra il formato ChatMessage standard e il formato OpenAI
 */
export class OpenAITransformer
  implements
    BaseTransformer<
      ChatCompletionOptions,
      ChatCompletionMessageParam,
      ChatCompletionChunk,
      ChatCompletion
    >
{
  /**
   * Converte messaggi da formato standard a formato OpenAI
   *
   * @param messages Array di messaggi in formato standard
   * @returns Array di messaggi nel formato OpenAI
   */
  static toLLMMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
    return messages.map((message) => {
      const role = message.role;
      let content: string;

      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        const textParts = message.content.filter(isTextBlock).map(b => b.text);
        content = textParts.length > 0 ? textParts.join('\n') : '[Contenuto multimodale non elaborato]';
      } else {
        content = '[Contenuto non valido]';
      }

      const openAiMessage: ChatCompletionMessageParam = {
        role: role,
        content: content,
      };
      return openAiMessage;
    });
  }

  /**
   * Crea le opzioni di richiesta per OpenAI
   *
   * @param options Opzioni di base
   * @param messages Messaggi già convertiti nel formato OpenAI
   * @returns Opzioni di richiesta complete per OpenAI
   */
  static createRequestOptions(
    options: BaseRequestOptions,
    messages: ChatCompletionMessageParam[]
  ): ChatCompletionOptions {
    const openaiOptions: ChatCompletionOptions = {
      model: options.modelId,
      messages: messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: options.stream ?? false,
    };

    if (options.systemPrompt && options.systemPrompt.trim() !== '') {
      openaiOptions.messages.unshift(createChatMessage({role: 'system', content: options.systemPrompt,
          timestamp: Date.now()
    }));
    }

    return openaiOptions;
  }

  /**
   * Estrae il testo da un chunk di risposta streaming
   *
   * @param chunk Chunk di risposta streaming di OpenAI
   * @returns Testo estratto dal chunk
   */
  static extractTextFromChunk(chunk: ChatCompletionChunk): string | undefined {
    if (!chunk || !chunk.choices || chunk.choices.length === 0) {
      return undefined;
    }

    return chunk.choices[0].delta.content;
  }

  /**
   * Estrae il testo di ragionamento da un chunk di risposta streaming
   *
   * @param chunk Chunk di risposta streaming di OpenAI
   * @returns Testo di ragionamento estratto dal chunk
   */
  static extractReasoningFromChunk(chunk: ChatCompletionChunk): string | undefined {
    if (!chunk || !chunk.choices || chunk.choices.length === 0) {
      return undefined;
    }

    return chunk.choices[0].delta.reasoning_content;
  }

  /**
   * Estrae informazioni di utilizzo token
   *
   * @param response Risposta completa o chunk di OpenAI
   * @returns Informazioni su utilizzo token
   */
  static extractTokenUsage(response: ChatCompletion | ChatCompletionChunk): TokenUsage | undefined {
    if (!response || !response.usage) {
      return undefined;
    }

    return {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    };
  }

  /**
   * Converte una risposta completa di OpenAI in un messaggio standardizzato
   *
   * @param response Risposta completa di OpenAI
   * @returns Messaggio in formato standard
   */
  static fromLLMResponse(response: ChatCompletion): ChatMessage {
    if (!response || !response.choices || response.choices.length === 0) {
      return createChatMessage({role: 'assistant', content: '', timestamp: Date.now()});
    }

    const choice = response.choices[0];
    let content: string | ContentBlock[] = '';

    if (typeof choice.message.content === 'string') {
      content = choice.message.content;
    } else if (choice.message.content === null) {
        content = '';
    } else {
      content = '[Contenuto risposta non testuale]';
    }

    return createChatMessage({
        role: 'assistant',
        content: content,
        timestamp: Date.now(),
        providerFields: {
            model: response.model,
            stopReason: choice.finish_reason,
            usage: {
                promptTokens: response.usage?.prompt_tokens,
                completionTokens: response.usage?.completion_tokens,
                totalTokens: response.usage?.total_tokens,
            },
        }
    });
  }
}

export const convertToOpenAiMessages = OpenAITransformer.toLLMMessages;
export const createOpenAiRequestOptions = OpenAITransformer.createRequestOptions;
export const convertOpenAiResponseToChatMessage = OpenAITransformer.fromLLMResponse;
