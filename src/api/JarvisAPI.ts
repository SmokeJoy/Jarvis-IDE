import { z } from 'zod';
import { Logger } from '../utils/logger';
import { 
  ModelInfo, 
  APIResponse, 
  APIConfiguration,
  LLMProviderId,
  ApiStreamChunk,
  ApiMessage,
  ApiMessageHandler
} from '@shared/types/api.types';
import { fetchOpenAIModels, sendOpenAIMessage } from '../providers/openai/openai-provider';
import {
  ApiMessageType,
  ApiMessageUnion,
  isSetConfigurationMessage,
  isGetConfigurationMessage,
  isLoadModelsMessage,
  isSendMessageMessage,
  isResetMessage
} from '@shared/messages/api-messages';

const logger = new Logger('JarvisAPI');

/**
 * Classe principale per l'API di Jarvis
 */
export class JarvisAPI {
  private static instance: JarvisAPI;
  private apiConfiguration: APIConfiguration;
  private messageHandlers: Map<ApiMessageType, Set<ApiMessageHandler>>;

  private constructor() {
    logger.debug('Inizializzazione JarvisAPI');
    this.messageHandlers = new Map();
    this.apiConfiguration = {
      provider: LLMProviderId.OpenAI,
      apiKey: '',
      modelId: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      organizationId: undefined
    };
  }

  /**
   * Ottiene l'istanza singleton di JarvisAPI
   */
  public static getInstance(): JarvisAPI {
    if (!JarvisAPI.instance) {
      JarvisAPI.instance = new JarvisAPI();
    }
    return JarvisAPI.instance;
  }

  /**
   * Registra un handler per un tipo di messaggio
   */
  public on(type: ApiMessageType, handler: ApiMessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.add(handler);
    }
  }

  /**
   * Rimuove un handler per un tipo di messaggio
   */
  public off(type: ApiMessageType, handler: ApiMessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  public async handleMessage(message: ApiMessageUnion): Promise<APIResponse<unknown>> {
    try {
      if (!this.isValidMessage(message)) {
        throw new Error('Messaggio non valido');
      }

      if (isSetConfigurationMessage(message)) {
        return await this.setConfiguration((msg.payload as unknown).config);
      }
      
      if (isGetConfigurationMessage(message)) {
        return await this.getConfiguration();
      }
      
      if (isLoadModelsMessage(message)) {
        return await this.loadModels((msg.payload as unknown).apiKey);
      }
      
      if (isSendMessageMessage(message)) {
        const { message: text, modelId, apiKey } = (msg.payload as unknown);
        return await this.sendMessage(text, modelId, apiKey);
      }
      
      if (isResetMessage(message)) {
        return await this.reset();
      }
      
      throw new Error(`Tipo di messaggio non supportato: ${message.type}`);
    } catch (error) {
      logger.error('Errore nella gestione del messaggio:', error instanceof Error ? error : new Error('Errore sconosciuto'));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  private isValidMessage(message: unknown): message is ApiMessageUnion {
    return typeof message === 'object' && 
           message !== null && 
           'type' in message &&
           typeof (message as any).type === 'string';
  }

  /**
   * Imposta la configurazione dell'API
   */
  public async setConfiguration(config: Partial<APIConfiguration>): Promise<APIResponse<void>> {
    try {
      if (!this.isValidConfig(config)) {
        throw new Error('Configurazione non valida');
      }

      this.apiConfiguration = {
        ...this.apiConfiguration,
        ...config
      };
      
      return { success: true };
    } catch (error) {
      logger.error('Errore nell\'impostazione della configurazione:', error instanceof Error ? error : new Error('Errore sconosciuto'));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  private isValidConfig(config: unknown): config is Partial<APIConfiguration> {
    return typeof config === 'object' && config !== null;
  }

  /**
   * Ottiene la configurazione corrente dell'API
   */
  public async getConfiguration(): Promise<APIResponse<APIConfiguration>> {
    try {
      return {
        success: true,
        data: { ...this.apiConfiguration }
      };
    } catch (error) {
      logger.error('Errore nel recupero della configurazione:', error instanceof Error ? error : new Error('Errore sconosciuto'));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  /**
   * Carica i modelli disponibili per il provider corrente
   */
  public async loadModels(apiKey?: string): Promise<APIResponse<ModelInfo[]>> {
    try {
      const key = apiKey || this.apiConfiguration.apiKey;
      if (!key) {
        throw new Error('API key non fornita');
      }

      let models: ModelInfo[] = [];
      
      switch (this.apiConfiguration.provider) {
        case LLMProviderId.OpenAI:
          models = await fetchOpenAIModels(key, this.apiConfiguration.organizationId);
          break;
        case LLMProviderId.Anthropic:
          throw new Error('Provider Anthropic non ancora implementato');
        case LLMProviderId.Google:
          throw new Error('Provider Google non ancora implementato');
        case LLMProviderId.Local:
          throw new Error('Provider Local non ancora implementato');
        default:
          throw new Error(`Provider ${this.apiConfiguration.provider} non supportato`);
      }

      return {
        success: true,
        data: models
      };
    } catch (error) {
      logger.error('Errore nel caricamento dei modelli:', error instanceof Error ? error : new Error('Errore sconosciuto'));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  /**
   * Invia un messaggio al modello e restituisce uno stream di risposte
   */
  public async sendMessage(
    message: string,
    modelId?: string,
    apiKey?: string
  ): Promise<APIResponse<ReadableStream<ApiStreamChunk>>> {
    try {
      const key = apiKey || this.apiConfiguration.apiKey;
      if (!key) {
        throw new Error('API key non fornita');
      }

      const model = modelId || this.apiConfiguration.modelId;
      if (!model) {
        throw new Error('Model ID non fornito');
      }

      let response: ReadableStream<ApiStreamChunk>;

      switch (this.apiConfiguration.provider) {
        case LLMProviderId.OpenAI:
          response = await sendOpenAIMessage({
            apiKey: key,
            organizationId: this.apiConfiguration.organizationId,
            model,
            messages: [{ role: 'user', content: message }],
            temperature: this.apiConfiguration.temperature,
            maxTokens: this.apiConfiguration.maxTokens?.toString()
          });
          break;
        case LLMProviderId.Anthropic:
          throw new Error('Provider Anthropic non ancora implementato');
        case LLMProviderId.Google:
          throw new Error('Provider Google non ancora implementato');
        case LLMProviderId.Local:
          throw new Error('Provider Local non ancora implementato');
        default:
          throw new Error(`Provider ${this.apiConfiguration.provider} non supportato`);
      }

      return {
        success: true,
        data: response
      };
    } catch (error) {
      logger.error('Errore nell\'invio del messaggio:', error instanceof Error ? error : new Error('Errore sconosciuto'));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  /**
   * Resetta lo stato dell'API
   */
  public async reset(): Promise<APIResponse<void>> {
    try {
      this.apiConfiguration = {
        provider: LLMProviderId.OpenAI,
        apiKey: '',
        modelId: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4000,
        organizationId: undefined
      };
      return {
        success: true
      };
    } catch (error) {
      logger.error('Errore nel reset dell\'API:', error instanceof Error ? error : new Error('Errore sconosciuto'));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  /**
   * Elimina l'istanza e pulisce gli handler
   */
  public dispose(): void {
    this.messageHandlers.clear();
  }
} 
 