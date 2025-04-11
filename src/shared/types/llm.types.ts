/**
 * @file llm.types.ts
 * @description Definizione centralizzata di tutti i tipi relativi ai modelli LLM e alle loro API
 * Questo file è la fonte di verità per tutte le interfacce e i tipi LLM nel sistema
 */

/**
 * Parte di testo di un messaggio multimodale
 */
export interface ChatCompletionContentPartText {
  type: 'text';
  text: string;
}

/**
 * Parte immagine di un messaggio multimodale
 * Formato secondo le specifiche OpenAI
 */
export interface ChatCompletionContentPartImage {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

/**
 * Tipo unione per le parti di contenuto
 * Usato nelle API di completamento delle chat
 */
export type ChatCompletionContentPart = 
  | ChatCompletionContentPartText 
  | ChatCompletionContentPartImage;

/**
 * Parametri per blocchi di immagini
 * Standardizzati per evitare duplicazioni
 */
export interface ImageBlockParam {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

/**
 * Identificatori per i diversi provider di LLM
 */
export type LLMProviderId = 
  | 'anthropic'
  | 'openai'
  | 'azureopenai'
  | 'openrouter'
  | 'vertex'
  | 'aws'
  | 'gemini'
  | 'ollama'
  | 'lmstudio'
  | 'deepseek'
  | 'qwen'
  | 'mistral'
  | 'litellm'
  | 'asksage'
  | 'sambanova'
  | 'xai'
  | 'jarvis-ide'
  | 'default'
  | 'zero';

// Importazioni dei nuovi tipi da api.types.ts
import { 
  ModelInfoBase,
  ModelInfoStandard,
  ModelCapabilitiesInfo,
  ModelPricingInfo,
  ModelInfo as ApiModelInfo,
  OpenAiCompatibleModelInfo as ApiOpenAiCompatibleModelInfo,
  AnthropicModelInfo as ApiAnthropicModelInfo,
  OpenRouterModelInfo as ApiOpenRouterModelInfo,
  AzureOpenAIModelInfo as ApiAzureOpenAIModelInfo,
  ApiConfiguration as ApiApiConfiguration
} from './api.types.js';

// Ri-esportiamo i tipi importati per retrocompatibilità
export { 
  ModelInfoBase,
  ModelInfoStandard,
  ModelCapabilitiesInfo,
  ModelPricingInfo
};

/**
 * @deprecated Usare ModelInfo da api.types.ts
 */
export type ModelInfo = ApiModelInfo;

/**
 * @deprecated Usare OpenAiCompatibleModelInfo da api.types.ts
 */
export type OpenAiCompatibleModelInfo = ApiOpenAiCompatibleModelInfo;

/**
 * @deprecated Usare AnthropicModelInfo da api.types.ts
 */
export type AnthropicModelInfo = ApiAnthropicModelInfo;

/**
 * @deprecated Usare OpenRouterModelInfo da api.types.ts
 */
export type OpenRouterModelInfo = ApiOpenRouterModelInfo;

/**
 * @deprecated Usare AzureOpenAIModelInfo da api.types.ts
 */
export type AzureOpenAIModelInfo = ApiAzureOpenAIModelInfo;

/**
 * Interfaccia comune per tutti i provider LLM
 */
export interface LLMProvider {
  id: LLMProviderId;
  name: string;
  supportsStreaming: boolean;
  requiresApiKey: boolean;
  modelOptions: ModelInfo[];
  defaultModel: string;
}

/**
 * Parametri per i messaggi
 * Utilizzati nelle API di chat completion
 */
export interface MessageParam {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | (ChatCompletionContentPartText | ChatCompletionContentPartImage)[];
  name?: string;
}

/**
 * Struttura per un chunk di streaming di testo
 */
export interface ApiStreamTextChunk {
  type: 'text';
  text: string;
}

/**
 * Struttura per un chunk di streaming di reasoning
 */
export interface ApiStreamReasoningChunk {
  type: 'reasoning';
  text: string;
}

/**
 * Struttura per un chunk di streaming con informazioni sull'utilizzo
 */
export interface ApiStreamUsageChunk {
  type: 'usage';
  usageData: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Generatore di messaggio per l'API
 */
export type ApiMessageGenerator = AsyncGenerator<ApiStreamTextChunk | ApiStreamReasoningChunk | ApiStreamUsageChunk>;

/**
 * Interfaccia per i componenti stream API
 */
export interface ApiStream {
  stream: ApiMessageGenerator;
}

/**
 * Struttura di errore per le API
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * @deprecated Usare ApiConfiguration da api.types.ts
 */
export type ApiConfiguration = ApiApiConfiguration;