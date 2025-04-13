import { ChatCompletionMessageParam } from '../../types/provider-types/openai-types';
import { DeepSeekConfig } from '../config/deepseek-config';
import { logger } from '../../utils/logger';
import {
  ChatMessage,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ContentType,
  isTextBlock,
  isImageBlock,
} from '../../types/chat.types';
import { createSafeMessage } from "../../../shared/types/message";

export interface DeepSeekApiOptions {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stream: boolean;
  stream_options: {
    include_usage: boolean;
  };
}

/**
 * Transformer per il formato DeepSeek
 * Gestisce la conversione di messaggi tra il formato standard e il formato DeepSeek
 */
export class DeepSeekTransformer {
  /**
   * Converte un array di ChatMessage nel formato richiesto dal modello DeepSeek
   * @param messages Array di ChatMessage da convertire
   * @returns Array di messaggi nel formato OpenAI con regole specifiche per DeepSeek
   */
  static toLLMMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
    return messages.map((message) => {
      // Il formato DeepSeek è basato su OpenAI, con alcune piccole differenze
      const role = message.role === 'assistant' ? 'assistant' : 'user';

      // Gestione del contenuto del messaggio (testo e immagini)
      let content: string | any[] = '';

      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        // Per ora supportiamo solo testo e immagini
        const contentBlocks = message.content
          .map((block) => {
            if (isTextBlock(block)) {
              return { type: 'text', text: block.text };
            } else if (isImageBlock(block)) {
              // DeepSeek supporta il formato OpenAI per le immagini
              if (block.base64Data) {
                return {
                  type: 'image',
                  image_url: {
                    url: `data:${block.media_type || 'image/jpeg'};base64,${block.base64Data}`,
                  },
                };
              } else if (block.url) {
                return {
                  type: 'image',
                  image_url: {
                    url: block.url,
                  },
                };
              }
            }
            // Skip unsupported blocks
            logger.debug(`[DeepSeekTransformer] Blocco di tipo ${block.type} non supportato`);
            return null;
          })
          .filter(Boolean);

        if (contentBlocks.length === 1 && contentBlocks[0].type === 'text') {
          // Se c'è solo un blocco di testo, usa direttamente il testo
          content = contentBlocks[0].text;
        } else {
          // Altrimenti usa l'array di blocchi
          content = contentBlocks;
        }
      }

      return {
        role,
        content,
        name: message.name,
      };
    });
  }

  /**
   * Converte una risposta dal formato DeepSeek in testo standard
   */
  static fromLLMResponse(response: any): ChatMessage {
    try {
      if (!response) {
        throw new Error('Risposta DeepSeek non valida');
      }

      let content: ContentBlock[] = [];
      let stopReason = '';

      if (typeof response === 'string') {
        content = [{ type: ContentType.Text, text: response } as TextBlock];
      } else if (response.choices && response.choices[0]?.message?.content) {
        const responseContent = response.choices[0].message.content;

        if (typeof responseContent === 'string') {
          content = [{ type: ContentType.Text, text: responseContent } as TextBlock];
        } else if (Array.isArray(responseContent)) {
          content = responseContent.map((part) => {
            if (part.type === 'text') {
              return { type: ContentType.Text, text: part.text } as TextBlock;
            } else if (part.type === 'image' && part.image_url) {
              // Gestione delle immagini (in teoria DeepSeek non genera immagini,
              // ma manteniamo il supporto per completezza)
              return {
                type: ContentType.Image,
                url: part.image_url.url,
              } as ImageBlock;
            }
            return { type: ContentType.Text, text: '[Contenuto non supportato]' } as TextBlock;
          });
        }

        stopReason = response.choices[0].finish_reason || '';
      } else {
        throw new Error('Formato di risposta DeepSeek non supportato');
      }

      return {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        providerFields: {
          model: response.model || 'deepseek',
          stopReason,
          usage: {
            promptTokens: response.usage?.prompt_tokens,
            completionTokens: response.usage?.completion_tokens,
            totalTokens: response.usage?.total_tokens,
          },
        },
      };
    } catch (error) {
      logger.error(
        `[DeepSeekTransformer] Errore durante la conversione della risposta: ${error.message}`
      );
      return createSafeMessage({role: 'assistant', content: [{ type: ContentType.Text, text: '' } as TextBlock], timestamp: new Date().toISOString()});
    }
  }
}

/**
 * Converte la configurazione DeepSeek nel formato richiesto dall'API
 * @param config - Configurazione DeepSeek
 * @param modelId - ID del modello
 * @param messages - Messaggi da inviare
 * @returns Opzioni formattate per l'API DeepSeek
 */
export function convertToApiOptions(
  config: DeepSeekConfig,
  modelId: string,
  messages: ChatCompletionMessageParam[]
): DeepSeekApiOptions {
  return {
    model: modelId,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.topP,
    presence_penalty: config.presencePenalty,
    frequency_penalty: config.frequencyPenalty,
    stream: true,
    stream_options: config.streamOptions,
  };
}

// Funzione utility per convertire messaggi dal formato standard al formato DeepSeek
export const convertToDeepSeekFormat = DeepSeekTransformer.toLLMMessages;

// Funzione utility per convertire risposte dal formato DeepSeek al formato standard
export const convertFromDeepSeekResponse = DeepSeekTransformer.fromLLMResponse;
