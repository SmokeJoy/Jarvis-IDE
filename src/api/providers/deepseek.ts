import type OpenAI from 'openai';
import {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  Stream,
} from '../../types/provider-types/openai-types';
import { Anthropic } from '@anthropic-ai/sdk';
import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../src/shared/types/api.types';
import { logger } from '../../utils/logger';
import { ApiStream, ApiStreamChunk } from '../../src/shared/types/api.types';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { convertToR1Format } from '../transform/r1-format';
import { BaseStreamHandler } from '../handlers/BaseStreamHandler';
import { getDeepseekConfig } from './config/deepseek-config';
import { deepseekModelInfoSaneDefaults } from '../../shared/api';
import { calculateApiCostDeepSeek } from '../../utils/cost';
import { createChatMessage } from '../../src/shared/types/chat.types';

/**
 * Handler per l'API DeepSeek, estende BaseStreamHandler
 * per sfruttare la logica comune di streaming e retry
 */
export class DeepseekHandler extends BaseStreamHandler<ChatCompletionChunk> implements ApiHandler {
  private client: OpenAI;

  constructor(options: ApiHandlerOptions) {
    super(options);

    // DeepSeek usa un formato compatibile con OpenAI
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const OpenAIModule = require('openai');
    this.client = new OpenAIModule.OpenAI({
      baseURL: this.options.openAiBaseUrl,
      apiKey: this.options.openAiApiKey,
    });

    logger.debug(
      `[DeepseekHandler] Inizializzato con baseURL: ${this.options.openAiBaseUrl || 'default'}`
    );
  }

  /**
   * Implementazione del metodo astratto fetchAPIResponse
   * Effettua la chiamata API a DeepSeek e restituisce lo stream
   */
  protected async fetchAPIResponse(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): Promise<Stream<ChatCompletionChunk>> {
    const modelId = this.options.openAiModelId ?? '';
    const config = getDeepseekConfig(modelId);

    logger.debug(`[DeepseekHandler] Preparazione richiesta per modello: ${modelId}`);

    let openAiMessages: ChatCompletionMessageParam[] = [
      createChatMessage({role: 'system', content: systemPrompt,
          timestamp: Date.now()
    }),
      ...convertToOpenAiMessages(messages),
    ];

    if (config.useR1Format) {
      logger.debug(`[DeepseekHandler] Conversione messaggio al formato R1 richiesto`);
      openAiMessages = convertToR1Format([createChatMessage({role: 'user', content: systemPrompt,
          timestamp: Date.now()
    }), ...messages]);
    }

    logger.info(
      `[DeepseekHandler] Inizio chiamata API DeepSeek con ${openAiMessages.length} messaggi`
    );

    try {
      const response = await this.client.chat.completions.create({
        model: modelId,
        messages: openAiMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
        // stream_options: { include_usage: true } // Non supportato da tutti i modelli DeepSeek
      });

      logger.info(`[DeepseekHandler] Risposta API DeepSeek ricevuta correttamente`);
      return response;
    } catch (error) {
      logger.error(
        `[DeepseekHandler] Errore durante la chiamata API DeepSeek: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Implementazione del metodo astratto convertToStream
   * Questo converte lo stream DeepSeek nello stesso formato
   */
  protected convertToStream(
    stream: Stream<ChatCompletionChunk>
  ): AsyncIterable<ChatCompletionChunk> {
    logger.debug(`[DeepseekHandler] Conversione risposta in stream`);
    // Lo stream DeepSeek è già un AsyncIterable, quindi possiamo restituirlo direttamente
    return stream;
  }

  /**
   * Metodo pubblico createMessage, mantiene l'interfaccia ApiHandler
   * ma utilizza transformToApiStream per la conversione
   */
  async *createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    logger.info(`[DeepseekHandler] Creazione messaggio con modello ${this.getModel().id}`);

    // Otteniamo lo stream dalla classe base (con gestione retry)
    const rawStream = await this.getStream(systemPrompt, messages);

    logger.debug(`[DeepseekHandler] Stream ottenuto, inizio trasformazione in ApiStream`);

    // Utilizziamo transformToApiStream per convertire i chunk di DeepSeek
    // in ApiStreamChunk standardizzati
    const apiStream = this.transformToApiStream(rawStream, (chunk) => {
      const results: ApiStreamChunk[] = [];

      if (chunk.choices?.[0]?.delta?.content) {
        results.push({
          type: 'text',
          text: chunk.choices[0].delta.content,
        });
      }

      // DeepSeek non supporta reasoning_content

      // Usage non sempre disponibile in streaming
      if (chunk.usage) {
        results.push({
          type: 'usage',
          inputTokens: chunk.usage.prompt_tokens || 0,
          outputTokens: chunk.usage.completion_tokens || 0,
        });
      }

      return results;
    });

    // Cediamo il controllo allo stream trasformato
    yield* apiStream;
  }

  /**
   * Implementazione del metodo getModel
   */
  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.openAiModelId ?? '',
      info: this.options.openAiModelInfo ?? deepseekModelInfoSaneDefaults,
    };
  }
}
