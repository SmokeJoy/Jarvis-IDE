import { Anthropic } from '@anthropic-ai/sdk';
import { MistralClient } from '@mistralai/mistralai';
import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../src/shared/types/api.types';
import { calculateApiCostOpenAI } from '../../utils/cost';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk } from '../../src/shared/types/api.types';
import { convertToR1Format } from '../transform/r1-format';
import { BaseStreamHandler } from '../handlers/BaseStreamHandler';
import { logger } from '../../utils/logger';
import {
  mistralDefaultModelId,
  MistralModelId,
  mistralModels,
  mistralChatProModels,
  mistralSmallModels,
  openAiNativeDefaultModelId,
  OpenAiNativeModelId,
  openAiNativeModels,
} from '../../shared/api';
import { convertToMistralMessages } from '../transform/mistral-format';
import { createChatMessage } from '../../src/shared/types/chat.types';

/**
 * Interfaccia per le statistiche di utilizzo token di Mistral
 * Definisce il formato dei dati di utilizzo token restituiti dalle API Mistral
 */
interface MistralUsage {
  /** Numero di token utilizzati nel prompt */
  prompt_tokens: number;
  
  /** Numero di token generati nella risposta */
  completion_tokens: number;
  
  /** Numero totale di token (prompt + completion) */
  total_tokens: number;
}

/**
 * Formato dei blocchi di testo per contenuti Mistral
 * Definisce la struttura di un blocco di contenuto testuale
 */
interface MistralTextBlock {
  /** Tipo di contenuto, deve essere 'text' */
  type: string;
  
  /** Contenuto testuale del blocco */
  text: string;
}

/**
 * Interfaccia per i chunk di streaming nelle risposte Mistral
 * Rappresenta un singolo frammento di risposta ricevuto dallo stream
 */
interface MistralStreamChunk {
  /** Dati del chunk, incluse scelte e statistiche */
  data?: {
    /** Array di scelte (solitamente contiene una sola scelta) */
    choices?: Array<{
      /** Contenuto incrementale della risposta */
      delta?: {
        /** Contenuto testuale, può essere una stringa o un array di blocchi */
        content?: string | Array<MistralTextBlock>;
      };
    }>;
    
    /** Statistiche di utilizzo token (presente solo nell'ultimo chunk) */
    usage?: MistralUsage;
  };
}

/**
 * Handler per l'API Mistral
 * Implementa ApiHandler per integrare i modelli Mistral nell'applicazione
 */
export class MistralHandler implements ApiHandler {
  /** Opzioni di configurazione per l'API */
  private options: ApiHandlerOptions;
  
  /** Client Mistral istanziato durante la costruzione */
  private client: MistralClient;

  /**
   * Costruisce un nuovo handler per Mistral
   * @param options - Opzioni di configurazione per l'API
   */
  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new MistralClient({
      apiKey: this.options.mistralApiKey,
    });
  }

  /**
   * Crea un messaggio utilizzando l'API Mistral
   * @param systemPrompt - Il prompt di sistema da utilizzare
   * @param messages - I messaggi da inviare al modello
   * @returns ApiStream con i chunk di risposta
   */
  async *createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    const maxRetries = 2;
    const retryDelay = 500;
    let attempt = 0;

    while (true) {
      try {
        attempt++;
        const stream = await this.client.chat.stream({
          model: this.getModel().id,
          temperature: 0,
          messages: [
            createChatMessage({role: 'system', content: systemPrompt,
                timestamp: Date.now()
            }),
            ...convertToMistralMessages(messages),
          ],
          stream: true,
        });

        for await (const chunk of stream) {
          const mistralChunk = chunk as MistralStreamChunk;

          if (
            mistralChunk?.data?.choices &&
            Array.isArray(mistralChunk.data.choices) &&
            mistralChunk.data.choices.length > 0
          ) {
            const delta = mistralChunk.data.choices[0]?.delta ?? {};

            if (delta && 'content' in delta && delta.content) {
              let content: string = '';
              if (typeof delta.content === 'string') {
                content = delta.content;
              } else if (Array.isArray(delta.content)) {
                content = delta.content
                  .filter(
                    (c): c is MistralTextBlock =>
                      c !== null &&
                      typeof c === 'object' &&
                      'type' in c &&
                      c.type === 'text' &&
                      'text' in c &&
                      typeof c.text === 'string'
                  )
                  .map((c) => c.text)
                  .join('');
              }

              if (content) {
                yield {
                  type: 'text',
                  text: content,
                };
              }
            }
          }

          if (mistralChunk?.data?.usage) {
            const mistralUsage = mistralChunk.data.usage;
            yield {
              type: 'usage',
              inputTokens: mistralUsage.prompt_tokens || 0,
              outputTokens: mistralUsage.completion_tokens || 0,
            };
          }
        }
        break;
      } catch (error) {
        logger.error(
          `[MistralHandler] Tentativo ${attempt}/${maxRetries + 1} fallito: ${error instanceof Error ? error.message : String(error)}`
        );
        if (attempt > maxRetries) {
          logger.error(
            `[MistralHandler] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Ottiene le informazioni sul modello configurato
   * @returns Oggetto con ID e informazioni sul modello
   */
  getModel(): { id: MistralModelId; info: ModelInfo } {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in mistralModels) {
      const id = modelId as MistralModelId;
      return { id, info: mistralModels[id] };
    }
    return {
      id: mistralDefaultModelId,
      info: mistralModels[mistralDefaultModelId],
    };
  }
}
