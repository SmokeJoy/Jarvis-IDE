import OpenAI, { AzureOpenAI } from 'openai';
import { ApiHandlerOptions, ModelInfo } from '../../src/shared/types/api.types';
import {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  Stream,
} from '../../types/provider-types/openai-types';
import { Anthropic } from '@anthropic-ai/sdk';
import { azureOpenAiDefaultApiVersion, openAiModelInfoSaneDefaults } from '../../shared/api';
import { ApiHandler } from '../index';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk } from '../../src/shared/types/api.types';
import { convertToR1Format } from '../transform/r1-format';
import { BaseStreamHandler } from '../handlers/BaseStreamHandler';
import { logger } from '../../utils/logger';
import { calculateApiCostOpenAI } from '../../utils/cost';
import { getOpenAiConfig } from './config/openai-config';
import { createChatMessage } from '../../src/shared/types/chat.types';

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

/**
 * Handler per l'API OpenAI che estende BaseStreamHandler
 * per sfruttare la logica comune di streaming e retry
 */
export class OpenAiHandler extends BaseStreamHandler<ChatCompletionChunk> implements ApiHandler {
  /** Client OpenAI istanziato durante la costruzione */
  private client: OpenAI;

  /**
   * Costruisce un nuovo handler per OpenAI
   * @param options - Opzioni di configurazione per l'API
   */
  constructor(options: ApiHandlerOptions) {
    super(options);

    // Azure API shape slightly differs from the core API shape: https://github.com/openai/openai-node?tab=readme-ov-file#microsoft-azure-openai
    // Use azureApiVersion to determine if this is an Azure endpoint, since the URL may not always contain 'azure.com'
    if (
      this.options.azureApiVersion ||
      this.options.openAiBaseUrl?.toLowerCase().includes('azure.com')
    ) {
      this.client = new AzureOpenAI({
        baseURL: this.options.openAiBaseUrl,
        apiKey: this.options.openAiApiKey,
        apiVersion: this.options.azureApiVersion || azureOpenAiDefaultApiVersion,
      });
    } else {
      this.client = new OpenAI({
        baseURL: this.options.openAiBaseUrl,
        apiKey: this.options.openAiApiKey,
      });
    }
    logger.debug(
      `[OpenAiHandler] Inizializzato con baseURL: ${this.options.openAiBaseUrl || 'default'}`
    );
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
    messages: Anthropic.Messages.MessageParam[]
  ): Promise<Stream<ChatCompletionChunk>> {
    const modelId = this.options.openAiModelId ?? '';
    const isDeepseekReasoner = modelId.includes('deepseek-reasoner');
    const isR1FormatRequired = this.options.openAiModelInfo?.isR1FormatRequired ?? false;

    logger.debug(`[OpenAiHandler] Preparazione richiesta per modello: ${modelId}`);

    let openAiMessages: ChatCompletionMessageParam[] = [
      createChatMessage({role: 'system', content: systemPrompt,
          timestamp: Date.now()
    }),
      ...convertToOpenAiMessages(messages),
    ];

    if (isDeepseekReasoner || isR1FormatRequired) {
      logger.debug(`[OpenAiHandler] Conversione messaggio al formato R1 richiesto`);
      openAiMessages = convertToR1Format([createChatMessage({role: 'user', content: systemPrompt,
          timestamp: Date.now()
    }), ...messages]);
    }

    const config = getOpenAiConfig(modelId, this.options.openAiModelInfo);

    logger.info(`[OpenAiHandler] Inizio chiamata API OpenAI con ${openAiMessages.length} messaggi`);

    try {
      const response = await this.client.chat.completions.create({
        model: modelId,
        messages: openAiMessages,
        temperature: config.temperature,
        ...(config.maxTokens ? { maxTokens: config.maxTokens } : {}),
        ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
        stream: true,
        stream_options: { include_usage: true },
      });

      logger.info(`[OpenAiHandler] Risposta API OpenAI ricevuta correttamente`);
      return response;
    } catch (error) {
      logger.error(
        `[OpenAiHandler] Errore durante la chiamata API OpenAI: ${error instanceof Error ? error.message : String(error)}`
      );
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
    messages: Anthropic.Messages.MessageParam[]
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
   * Implementazione del metodo getModel
   * Restituisce l'ID e le informazioni sul modello configurato
   * 
   * @returns Oggetto con ID e informazioni sul modello
   */
  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.openAiModelId ?? '',
      info: this.options.openAiModelInfo ?? openAiModelInfoSaneDefaults,
    };
  }
}
