import OpenAI, { AzureOpenAI } from 'openai';
import { ApiHandlerOptions, ModelInfo } from '../../shared/types/api.types';
import {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  Stream,
} from '../../types/provider-types/openai-types';
import { Anthropic } from '@anthropic-ai/sdk';
import { openAiModelInfoSaneDefaults } from '../../shared/api';
import { ApiHandler } from '../index';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk } from '../../shared/types/api.types';
import { convertToR1Format } from '../transform/r1-format';
import { BaseStreamHandler } from '../handlers/BaseStreamHandler';
import { logger } from '../../utils/logger';
import { calculateApiCostOpenAI } from '../../utils/cost';
import { getOpenAiConfig } from './config/openai-config';
import { createChatMessage, ChatMessage } from '../../shared/types/chat.types';
import { createOpenAIClient } from './factories/openai-factory';
import { OpenAiUsage } from './schemas/openai.schema';

/**
 * Interfaccia per le informazioni di utilizzo delle API OpenAI
 * Definisce il formato dei dati di utilizzo token restituiti dalle API
 */
interface OpenAiUsage {
  /** Numero di token utilizzati nel prompt */
  prompt_tokens: number;
  
  /** Numero di token generati nella risposta */
  completion_tokens: number;
  
  /** Numero totale di token (prompt + completion) */
  total_tokens: number;
}

/**
 * Interfaccia per i chunk streaming nelle risposte OpenAI
 * Rappresenta un singolo frammento di risposta ricevuto in streaming
 */
interface OpenAiStreamChunk {
  /** Array di scelte (di solito contiene una sola scelta) */
  choices?: Array<{
    /** Contenuto incrementale della risposta */
    delta?: {
      /** Contenuto testuale principale */
      content?: string;
      
      /** Contenuto di reasoning (per modelli che supportano reasoning) */
      reasoning_content?: string;
    };
  }>;
  
  /** Informazioni di utilizzo token (presente solo nell'ultimo chunk) */
  usage?: OpenAiUsage;
}

// Schema di validazione per le opzioni OpenAI
const openAiOptionsSchema = z.object({
  openAiBaseUrl: z.string().optional(),
  openAiApiKey: z.string(),
  azureApiVersion: z.string().optional(),
  openAiModelId: z.string(),
  openAiModelInfo: z.any().optional() // TODO: definire schema specifico per ModelInfo
});

/**
 * Handler per l'API OpenAI che estende BaseStreamHandler
 * per sfruttare la logica comune di streaming e retry
 */
export class OpenAiHandler extends BaseStreamHandler<ChatCompletionChunk> implements ApiHandler {
  private readonly client: OpenAI | AzureOpenAI;
  private readonly isAzure: boolean;

  /**
   * Costruisce un nuovo handler per OpenAI
   * @param options - Opzioni di configurazione per l'API
   */
  constructor(options: ApiHandlerOptions) {
    super(options);
    
    try {
      this.client = createOpenAIClient(options);
      this.isAzure = !!(options.azureApiVersion || options.openAiBaseUrl?.toLowerCase().includes('azure.com'));
      
      logger.debug(
        `[OpenAiHandler] Initialized with ${this.isAzure ? 'Azure' : 'OpenAI'} configuration. BaseURL: ${options.openAiBaseUrl || 'default'}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[OpenAiHandler] Failed to initialize client: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Implementazione del metodo astratto fetchAPIResponse
   * Effettua la chiamata API a OpenAI e restituisce lo stream
   * 
   * @param systemPrompt - Il prompt di sistema da utilizzare
   * @param messages - Array di messaggi da inviare al modello
   * @returns Promise con lo stream di risposta dall'API
   */
  protected async fetchAPIResponse(
    systemPrompt: string,
    messages: ChatMessage[]
  ): Promise<Stream<ChatCompletionChunk>> {
    if (!this.options.openAiModelId) {
      throw new Error('OpenAI model ID is required');
    }

    const modelId = this.options.openAiModelId;
    const isDeepseekReasoner = modelId.includes('deepseek-reasoner');
    const isR1FormatRequired = this.options.openAiModelInfo?.isR1FormatRequired ?? false;

    logger.debug(`[OpenAiHandler] Preparing request for model: ${modelId}`);

    let openAiMessages: ChatCompletionMessageParam[] = [
      createChatMessage({ role: 'system', content: systemPrompt, timestamp: Date.now() }),
      ...convertToOpenAiMessages(messages),
    ];

    if (isDeepseekReasoner || isR1FormatRequired) {
      logger.debug(`[OpenAiHandler] Converting messages to R1 format`);
      openAiMessages = convertToR1Format([
        createChatMessage({ role: 'user', content: systemPrompt, timestamp: Date.now() }),
        ...messages
      ]);
    }

    const config = getOpenAiConfig(modelId, this.options.openAiModelInfo);

    logger.info(`[OpenAiHandler] Starting OpenAI API call with ${openAiMessages.length} messages`);

    try {
      const response = await this.client.chat.completions.create({
        model: modelId,
        messages: openAiMessages,
        temperature: config.temperature,
        ...(config.maxTokens && { max_tokens: config.maxTokens }),
        ...(config.reasoningEffort && { reasoning_effort: config.reasoningEffort }),
        stream: true,
        stream_options: { include_usage: true }
      });

      logger.info(`[OpenAiHandler] OpenAI API response received successfully`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[OpenAiHandler] Error during OpenAI API call: ${errorMessage}`);
      
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.status === 401) {
          throw new Error('Invalid API key or unauthorized access.');
        }
      }
      throw error;
    }
  }

  /**
   * Implementazione del metodo astratto convertToStream
   * Converte lo stream OpenAI in un formato compatibile con AsyncIterable
   * 
   * @param stream - Stream di risposta da OpenAI
   * @returns AsyncIterable con i chunk di risposta
   */
  protected convertToStream(
    stream: Stream<ChatCompletionChunk>
  ): AsyncIterable<ChatCompletionChunk> {
    logger.debug(`[OpenAiHandler] Conversione risposta in stream`);
    // Lo stream OpenAI è già un AsyncIterable, quindi possiamo restituirlo direttamente
    return stream;
  }

  /**
   * Metodo pubblico createMessage, mantiene l'interfaccia ApiHandler
   * ma utilizza transformToApiStream per la conversione
   * 
   * @param systemPrompt - Il prompt di sistema da utilizzare
   * @param messages - Array di messaggi da inviare al modello
   * @returns ApiStream con la risposta in formato standardizzato
   */
  async *createMessage(
    systemPrompt: string,
    messages: ChatMessage[]
  ): ApiStream {
    logger.info(`[OpenAiHandler] Creazione messaggio con modello ${this.getModel().id}`);

    // Otteniamo lo stream dalla classe base (con gestione retry)
    const rawStream = await this.getStream(systemPrompt, messages);

    logger.debug(`[OpenAiHandler] Stream ottenuto, inizio trasformazione in ApiStream`);

    // Utilizziamo transformToApiStream per convertire i chunk di OpenAI
    // in ApiStreamChunk standardizzati
    const apiStream = this.transformToApiStream(rawStream, (chunk) => {
      const results: ApiStreamChunk[] = [];

      const openAiChunk = chunk as OpenAiStreamChunk;
      const delta = openAiChunk.choices?.[0]?.delta ?? {};

      if (delta?.content) {
        results.push({
          type: 'text',
          text: delta.content,
        });
      }

      if (delta?.reasoning_content) {
        results.push({
          type: 'reasoning',
          reasoning: delta.reasoning_content,
        });
      }

      if (openAiChunk?.usage) {
        const openAiUsage = openAiChunk.usage;
        logger.debug(
          `[OpenAiHandler] Ricevute informazioni di utilizzo: input=${openAiUsage.prompt_tokens}, output=${openAiUsage.completion_tokens}`
        );
        results.push({
          type: 'usage',
          inputTokens: openAiUsage.prompt_tokens || 0,
          outputTokens: openAiUsage.completion_tokens || 0,
        });
      }

      return results;
    });

    // Cediamo il controllo allo stream trasformato
    yield* apiStream;
  }

  /**
   * Restituisce le informazioni sul modello corrente
   */
  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.openAiModelId || '',
      info: this.options.openAiModelInfo || openAiModelInfoSaneDefaults
    };
  }
}
