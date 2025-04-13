import { Anthropic } from '@anthropic-ai/sdk';
import { ApiConfiguration, ModelInfo } from '../shared/types/api.types';
import { ApiStream, ApiStreamUsageChunk } from './transform/stream';

// Import handlers
import { AnthropicHandler } from './providers/anthropic';
import { AwsBedrockHandler } from './providers/bedrock';
import { OpenRouterHandler } from './providers/openrouter';
import { VertexHandler } from './providers/vertex';
import { OpenAiHandler } from './providers/openai';
import { OllamaHandler } from './providers/ollama';
import { LmStudioHandler } from './providers/lmstudio';
import { GeminiHandler } from './providers/gemini';
import { OpenAiNativeHandler } from './providers/openai-native';
import { DeepseekHandler } from './providers/deepseek';
import { RequestyHandler } from './providers/requesty';
import { TogetherHandler } from './providers/together';
import { QwenHandler } from './providers/qwen';
import { MistralHandler } from './providers/mistral';
import { VsCodeLmHandler } from './providers/vscode-lm';
import { JarvisIdeHandler } from './providers/jarvis-ide';
import { LiteLlmHandler } from './providers/litellm';
import { AskSageHandler } from './providers/asksage';
import { XAIHandler } from './providers/xai';
import { SambanovaHandler } from './providers/sambanova';

/**
 * Interfaccia principale per gli handler API
 * Definisce i metodi che tutti gli handler API devono implementare
 */
export interface ApiHandler {
  /**
   * Crea un messaggio utilizzando il modello configurato
   * @param systemPrompt - Il prompt di sistema da utilizzare
   * @param messages - I messaggi da inviare al modello
   * @returns Uno stream API tipizzato con la risposta del modello
   */
  createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream;
  
  /**
   * Ottiene le informazioni sul modello configurato
   * @returns Un oggetto con l'ID e le informazioni sul modello
   */
  getModel(): { id: string; info: ModelInfo };
  
  /**
   * Ottiene le statistiche di utilizzo dello stream API (opzionale)
   * @returns Una promise con le informazioni sull'utilizzo o undefined
   */
  getApiStreamUsage?(): Promise<ApiStreamUsageChunk | undefined>;
}

/**
 * Interfaccia per handler che supportano completamenti singoli
 */
export interface SingleCompletionHandler {
  /**
   * Completa un prompt utilizzando il modello configurato
   * @param prompt - Il prompt da completare
   * @returns Una promise con la risposta del modello
   */
  completePrompt(prompt: string): Promise<string>;
}

/**
 * Interfaccia estesa per le informazioni sui modelli OpenRouter
 * Estende ModelInfo con proprietà specifiche di OpenRouter
 */
export interface OpenRouterModelInfo extends ModelInfo {
  /** Identificatore univoco del modello OpenRouter */
  id: string;
  
  /** Nome leggibile del modello */
  name: string;
  
  /** Lunghezza del contesto supportata (in token) */
  context_length: number;
  
  /** Dimensione finestra di contesto */
  contextWindow: number;
  
  /** Temperatura raccomandata per il modello */
  temperature: number;
  
  /** Token massimi in output */
  maxTokens: number;
  
  /** Descrizione del modello */
  description: string;
  
  /** Provider del modello */
  provider: string;
  
  /** Prezzo per milione di token in input (in USD) */
  inputPrice: number;
  
  /** Prezzo per milione di token in output (in USD) */
  outputPrice: number;
  
  /** Indica se il modello supporta il caching dei prompt */
  supportsPromptCache: boolean;
  
  /** Indica se il modello supporta chiamate a funzioni */
  supportsFunctionCalling: boolean;
  
  /** Indica se il modello supporta l'elaborazione di immagini */
  supportsVision: boolean;
}

// Export handlers
export {
  AnthropicHandler,
  AwsBedrockHandler,
  OpenRouterHandler,
  VertexHandler,
  OpenAiHandler,
  OllamaHandler,
  LmStudioHandler,
  GeminiHandler,
  OpenAiNativeHandler,
  DeepseekHandler,
  RequestyHandler,
  TogetherHandler,
  QwenHandler,
  MistralHandler,
  VsCodeLmHandler,
  JarvisIdeHandler,
  LiteLlmHandler,
  AskSageHandler,
  XAIHandler,
  SambanovaHandler,
};

// Export types
export type { ApiStream, ApiStreamUsageChunk };

/**
 * Costruisce un handler API basato sulla configurazione fornita
 * @param configuration - La configurazione API da utilizzare
 * @returns Un'istanza di ApiHandler appropriata per il provider specificato
 */
export function buildApiHandler(configuration: ApiConfiguration): ApiHandler {
  const { provider, ...options } = configuration;

  try {
    switch (provider) {
      case 'anthropic':
        return new AnthropicHandler(options);
      case 'openrouter': {
        const modelInfo: OpenRouterModelInfo = options.openRouterModelInfo
          ? {
              ...options.openRouterModelInfo,
              id: options.openRouterModelInfo.id || options.openRouterModelId || '',
              name: options.openRouterModelInfo.name || '',
              context_length: options.openRouterModelInfo.context_length || 0,
              contextWindow: options.openRouterModelInfo.contextWindow || 0,
              temperature: options.openRouterModelInfo.temperature || 0,
              maxTokens: options.openRouterModelInfo.maxTokens || 0,
              description: options.openRouterModelInfo.description || '',
              provider: options.openRouterModelInfo.provider || '',
              inputPrice: options.openRouterModelInfo.inputPrice || 0,
              outputPrice: options.openRouterModelInfo.outputPrice || 0,
              supportsPromptCache: options.openRouterModelInfo.supportsPromptCache || false,
              supportsFunctionCalling: options.openRouterModelInfo.supportsFunctionCalling || false,
              supportsVision: options.openRouterModelInfo.supportsVision || false,
            }
          : {
              id: options.openRouterModelId || '',
              name: '',
              context_length: 0,
              contextWindow: 0,
              temperature: 0,
              maxTokens: 0,
              description: '',
              provider: '',
              inputPrice: 0,
              outputPrice: 0,
              supportsPromptCache: false,
              supportsFunctionCalling: false,
              supportsVision: false,
            };

        return new OpenRouterHandler({
          apiKey: options.openRouterApiKey || '',
          model: modelInfo,
        });
      }
      case 'bedrock':
        return new AwsBedrockHandler(options);
      case 'vertex':
        return new VertexHandler(options);
      case 'openai':
        return new OpenAiHandler(options);
      case 'ollama':
        return new OllamaHandler(options);
      case 'lmstudio':
        return new LmStudioHandler(options);
      case 'gemini':
        return new GeminiHandler(options);
      case 'openai-native':
        return new OpenAiNativeHandler(options);
      case 'deepseek':
        return new DeepseekHandler(options);
      case 'requesty':
        return new RequestyHandler(options);
      case 'together':
        return new TogetherHandler(options);
      case 'qwen':
        return new QwenHandler(options);
      case 'mistral':
        return new MistralHandler(options);
      case 'vscode-lm':
        return new VsCodeLmHandler(options);
      case 'jarvis-ide':
        return new JarvisIdeHandler(options);
      case 'litellm':
        return new LiteLlmHandler(options);
      case 'asksage':
        return new AskSageHandler(options);
      case 'xai':
        return new XAIHandler(options);
      case 'sambanova':
        return new SambanovaHandler(options);
      default:
        return new AnthropicHandler(options);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Errore nella creazione dell'handler per ${provider}:`, error.message);
    } else {
      console.error(`Errore sconosciuto nella creazione dell'handler per ${provider}`);
    }
    return new AnthropicHandler(options);
  }
}
