/**
 * @file llm.types.ts
 * @description Definizione centralizzata di tutti i tipi relativi ai modelli LLM e alle loro API
 * Questo file è la fonte di verità per tutte le interfacce e i tipi LLM nel sistema
 */

import type {
  ModelInfoBase,
  ModelInfoStandard,
  ModelCapabilitiesInfo,
  ModelPricingInfo,
  ModelInfo as ApiModelInfo,
  OpenAiCompatibleModelInfo as ApiOpenAiCompatibleModelInfo,
  AnthropicModelInfo as ApiAnthropicModelInfo,
  OpenRouterModelInfo as ApiOpenRouterModelInfo,
  AzureOpenAIModelInfo as ApiAzureOpenAIModelInfo,
  ApiConfiguration as ApiApiConfiguration,
} from './api.types';

import { ChatRole, ContentBlock } from './chat.types';

// Re-export types from api.types.ts
export type {
  ModelInfoBase,
  ModelInfoStandard,
  ModelCapabilitiesInfo,
  ModelPricingInfo,
};

/**
 * Dettaglio supportato per le immagini
 */
export type ImageDetail = 'low' | 'high' | 'auto';

/**
 * Parte di testo di un messaggio multimodale
 */
export interface ChatCompletionContentPartText {
  readonly type: 'text';
  text: string;
}

/**
 * Parte immagine di un messaggio multimodale
 * Formato secondo le specifiche OpenAI
 */
export interface ChatCompletionContentPartImage {
  readonly type: 'image_url';
  image_url: {
    readonly url: string;
    readonly detail?: ImageDetail;
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
  readonly type: 'image_url';
  readonly image_url: {
    readonly url: string;
    readonly detail?: ImageDetail;
  };
}

/**
 * Identificatori per i diversi provider di LLM
 */
export const enum LLMProviderId {
  Anthropic = 'anthropic',
  OpenAI = 'openai',
  AzureOpenAI = 'azureopenai',
  OpenRouter = 'openrouter',
  Vertex = 'vertex',
  AWS = 'aws',
  Gemini = 'gemini',
  Ollama = 'ollama',
  LMStudio = 'lmstudio',
  Deepseek = 'deepseek',
  Qwen = 'qwen',
  Mistral = 'mistral',
  LiteLLM = 'litellm',
  AskSage = 'asksage',
  SambaNova = 'sambanova',
  Mock = 'mock',
  Mock1 = 'mock1',
  Mock2 = 'mock2',
  Test = 'test'
}

/**
 * @deprecated Use ModelInfo from api.types.ts
 */
export type ModelInfo = ApiModelInfo;

/**
 * @deprecated Use OpenAiCompatibleModelInfo from api.types.ts
 */
export type OpenAiCompatibleModelInfo = ApiOpenAiCompatibleModelInfo;

/**
 * @deprecated Use AnthropicModelInfo from api.types.ts
 */
export type AnthropicModelInfo = ApiAnthropicModelInfo;

/**
 * @deprecated Use OpenRouterModelInfo from api.types.ts
 */
export type OpenRouterModelInfo = ApiOpenRouterModelInfo;

/**
 * @deprecated Use AzureOpenAIModelInfo from api.types.ts
 */
export type AzureOpenAIModelInfo = ApiAzureOpenAIModelInfo;

/**
 * Ruoli supportati per i messaggi
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

/**
 * Interfaccia comune per tutti i provider LLM
 */
export interface LLMProvider {
  readonly id: LLMProviderId;
  readonly name: string;
  readonly supportsStreaming: boolean;
  readonly requiresApiKey: boolean;
  readonly modelOptions: ModelInfo[];
  readonly defaultModel: string;
}

/**
 * Parametri per i messaggi
 * Utilizzati nelle API di chat completion
 */
export interface MessageParam {
  role: ChatRole;
  content: ContentBlock[]; // sempre strutturato per invio API
  name?: string;
}

/**
 * Struttura per un chunk di streaming di testo
 */
export interface ApiStreamTextChunk {
  readonly type: 'text';
  readonly text: string;
}

/**
 * Struttura per un chunk di streaming di reasoning
 */
export interface ApiStreamReasoningChunk {
  readonly type: 'reasoning';
  readonly text: string;
}

/**
 * Struttura per un chunk di streaming con informazioni sull'utilizzo
 */
export interface ApiStreamUsageChunk {
  readonly type: 'usage';
  readonly usageData: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };
}

/**
 * Tipo unione per tutti i tipi di chunk di streaming
 */
export type ApiStreamChunk = ApiStreamTextChunk | ApiStreamReasoningChunk | ApiStreamUsageChunk;

/**
 * Generatore di messaggio per l'API
 */
export type ApiMessageGenerator = AsyncGenerator<ApiStreamChunk>;

/**
 * Interfaccia per i componenti stream API
 */
export interface ApiStream {
  readonly stream: ApiMessageGenerator;
}

/**
 * Struttura di errore per le API
 */
export interface ApiError {
  readonly message: string;
  readonly code?: string;
  readonly status?: number;
}

/**
 * @deprecated Use ApiConfiguration from api.types.ts
 */
export type ApiConfiguration = ApiApiConfiguration;

// Aggiungo l'interfaccia spostata da global.d.ts
export interface OpenAiCompatibleModelInfo {
  id: string;
  name: string;
  provider: string;
  contextSize?: number;
  maxOutputTokens?: number;
  supportsStreaming?: boolean;
  supportsFunctions?: boolean;
  tags?: string[];
}

export interface LLMOptions {
  temperature?: number;
  top_p?: number;
  stop?: string[];
  max_tokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}
