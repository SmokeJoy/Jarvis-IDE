import { z } from 'zod';
import {
  ChatCompletionMessageParam,
  ChatCompletionContentPartText,
  ChatCompletionContentPartImage,
} from '../../types/provider-types/openai-types';
import { logger } from '../../utils/logger';
import {
  ChatMessage,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ContentType,
  isTextBlock,
  isImageBlock,
} from '../../src/shared/types/chat.types';
import { BaseTransformer } from './BaseTransformer';
import { createChatMessage as createChatMessage } from "../../src/shared/types/chat.types";

/**
 * Transformer per il formato R1 (DeepSeek Reasoner)
 * Gestisce la conversione di messaggi con particolare attenzione alla fusione di messaggi consecutivi
 * con lo stesso ruolo, poiché DeepSeek non supporta messaggi successivi con lo stesso ruolo.
 */
export class R1Transformer {
  /**
   * Converte un array di ChatMessage nel formato richiesto dal modello R1
   * @param messages Array di ChatMessage da convertire
   * @returns Array di messaggi nel formato OpenAI con consecutive messages con lo stesso ruolo uniti
   */
  static toLLMMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
    return messages.reduce<ChatCompletionMessageParam[]>((merged, message) => {
      const lastMessage = merged[merged.length - 1];
      let messageContent:
        | string
        | (ChatCompletionContentPartText | ChatCompletionContentPartImage)[] = '';
      let hasImages = false;

      // Gestione del contenuto del messaggio (testo e immagini)
      if (typeof message.content !== 'string' && Array.isArray(message.content)) {
        const textParts: string[] = [];
        const imageParts: ChatCompletionContentPartImage[] = [];

        // Iterazione sui blocchi di contenuto
        message.content.forEach((part: ContentBlock) => {
          if (isTextBlock(part)) {
            textParts.push(part.text);
          }
          if (isImageBlock(part)) {
            hasImages = true;

            if (part.base64Data) {
              imageParts.push({
                type: 'image',
                image_url: {
                  url: `data:${part.media_type || 'image/jpeg'};base64,${part.base64Data}`,
                  detail: 'auto',
                },
              });
            } else if (part.url) {
              imageParts.push({
                type: 'image',
                image_url: {
                  url: part.url,
                  detail: 'auto',
                },
              });
            }
          }
        });

        if (hasImages) {
          messageContent = [{ type: 'text', text: textParts.join('\n') }, ...imageParts];
        } else {
          messageContent = textParts.join('\n');
        }
      } else {
        messageContent = message.content as string;
      }

      // Unisci i messaggi se l'ultimo messaggio ha lo stesso ruolo
      if (lastMessage?.role === message.role) {
        // Gestisce correttamente la fusione in base ai tipi di contenuto
        if (typeof lastMessage.content === 'string' && typeof messageContent === 'string') {
          // Se entrambi sono stringhe, concatena
          lastMessage.content += `\n${messageContent}`;
        } else {
          // Se uno dei due non è una stringa, dobbiamo gestire array
          // Converti entrambi in array se necessario
          const lastContent = Array.isArray(lastMessage.content)
            ? lastMessage.content
            : ([
                { type: 'text' as const, text: lastMessage.content || '' },
              ] as ChatCompletionContentPartText[]);

          const newContent = Array.isArray(messageContent)
            ? messageContent
            : ([
                { type: 'text' as const, text: messageContent || '' },
              ] as ChatCompletionContentPartText[]);

          // Se lastMessage.content è una stringa, la sostituiamo con l'array risultante
          if (typeof lastMessage.content === 'string') {
            // TypeScript accetterà questo perché il tipo ChatCompletionMessageParam consente questa flessibilità
            (lastMessage as any).content = [...lastContent, ...newContent];
          } else {
            // Se è già un array, aggiungiamo gli elementi
            (lastMessage.content as any[]).push(...newContent);
          }
        }
      } else {
        // Aggiungi nuovo messaggio con il tipo corretto in base al ruolo
        merged.push(createChatMessage({role: message.role === 'assistant' ? 'assistant' : 'user', content: messageContent,
            timestamp: Date.now()
        }) as ChatCompletionMessageParam);
      }

      return merged;
    }, []);
  }

  /**
   * Converte la risposta dal formato R1 in testo standard
   */
  static fromLLMResponse(response: any): ChatMessage {
    try {
      if (!response) {
        throw new Error('Risposta R1 non valida');
      }

      let content: string | ContentBlock[] = '';
      let stopReason = '';

      if (typeof response === 'string') {
        content = response;
      } else if (response.choices && response.choices[0]?.message?.content) {
        content = response.choices[0].message.content;
        stopReason = response.choices[0].finish_reason || '';
      } else {
        throw new Error('Formato di risposta R1 non supportato');
      }

      // Assicurati che il contenuto sia nel formato corretto
      if (typeof content === 'string') {
        content = [
          {
            type: ContentType.Text,
            text: content,
          } as TextBlock,
        ];
      }

      return {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        providerFields: {
          model: response.model || 'r1',
          stopReason,
          usage: {
            promptTokens: response.usage?.prompt_tokens,
            completionTokens: response.usage?.completion_tokens,
            totalTokens: response.usage?.total_tokens,
          },
        },
      };
    } catch (error) {
      logger.error(`Errore durante la conversione della risposta R1: ${error.message}`);
      return createChatMessage({role: 'assistant', content: [
                                        {
                                          type: ContentType.Text,
                                          text: '',
                                        } as TextBlock,
                                      ], timestamp: new Date().toISOString()});
    }
  }

  /**
   * Converte un array di messaggi R1 nel formato ChatMessage standard
   * @param messages Array di messaggi R1 da convertire
   * @returns Array di ChatMessage
   */
  static toChatMessages(messages: any[]): ChatMessage[] {
    return messages.map((message) => {
      let content: string | ContentBlock[] = '';

      if (typeof message.content === 'string') {
        content = message.content;
      } else if (Array.isArray(message.content)) {
        // Converti le parti di contenuto nel nuovo formato
        content = message.content.map((part) => {
          if (part.type === 'text') {
            return {
              type: ContentType.Text,
              text: part.text,
            } as TextBlock;
          } else if (part.type === 'image') {
            // Handle OpenAI image format
            let url: string | undefined;
            let base64Data: string | undefined;
            let mediaType: string | undefined;

            if (part.image_url?.url) {
              if (part.image_url.url.startsWith('data:')) {
                // Handle base64 image
                const [metaPart, dataPart] = part.image_url.url.split(',');
                mediaType = metaPart.split(':')[1].split(';')[0];
                base64Data = dataPart;
              } else {
                // Handle URL image
                url = part.image_url.url;
              }
            }

            return {
              type: ContentType.Image,
              url,
              base64Data,
              media_type: mediaType,
            } as ImageBlock;
          }
          return {
            type: ContentType.Text,
            text: '[Contenuto non supportato]',
          } as TextBlock;
        });
      }

      return createChatMessage({role: message.role, content: content, name: message.name || undefined, timestamp: new Date().toISOString()}) as ChatMessage;
    });
  }
}

// Funzione utility per convertire messaggi dal formato standard al formato R1
export const convertToR1Format = R1Transformer.toLLMMessages;

// Funzione utility per convertire risposte dal formato R1 al formato standard
export const convertFromR1Response = R1Transformer.fromLLMResponse;
