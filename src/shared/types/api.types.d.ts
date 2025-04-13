/**
 * @file api.types.ts
 * @description File di reindirizzamento per le definizioni dei tipi API
 * @deprecated Per nuovi sviluppi, importare direttamente da llm.types.ts
 */
import { TelemetrySetting } from './telemetry.types';
import { ChatCompletionContentPartText, ChatCompletionContentPartImage } from './llm.types';
export * from './llm.types';
export { TelemetrySetting };
export type AzureOpenAIDeploymentId = string;
/**
 * Per retrocompatibilità con il tipo OpenRouterModelInfo
 */
export interface OpenRouterModelInfo {
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}
/**
 * @file api.types.ts
 * @description Definizioni centralizzate dei tipi API per l'intero sistema
 */
/**
 * Interfaccia base per le informazioni sui modelli
 */
export interface ModelInfo {
  id: string;
  name: string;
  contextLength: number;
  provider: LLMProviderId;
  maxTokens?: number;
  contextWindow?: number;
  capabilities?: string[];
  isThirdParty?: boolean;
  description?: string;
  supportsImages?: boolean;
  supportsComputerUse?: boolean;
  supportsPromptCache?: boolean;
  pricing?: {
    input?: number;
    output?: number;
  };
  inputPrice?: number;
  outputPrice?: number;
  cacheWritesPrice?: number;
  cacheReadsPrice?: number;
  temperature?: number;
}
/**
 * Estensione di ModelInfo per modelli compatibili con OpenAI
 */
export interface OpenAiCompatibleModelInfo extends ModelInfo {
  maxCompletionTokens?: number;
  supportsTools?: boolean;
  supportsVision?: boolean;
}
/**
 * Struttura per ottenere un trasformatore da un fornitore di API
 */
export interface ApiTransformer {
  transformRequest?: (request: any) => any;
  transformResponse?: (response: any) => any;
  transformError?: (error: any) => any;
}
/**
 * Opzioni per inizializzare un API Provider
 */
export interface ApiHandlerOptions {
  timeout?: number;
  baseUrl?: string;
  transformer?: ApiTransformer;
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
export type ApiMessageGenerator = AsyncGenerator<
  ApiStreamTextChunk | ApiStreamReasoningChunk | ApiStreamUsageChunk
>;
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
  | 'default'
  | 'zero';
/**
 * Interfaccia per i componenti stream API
 */
export interface ApiStream {
  stream: ApiMessageGenerator;
}
/**
 * Interfaccia unificata per le configurazioni di provider API
 * Questa è la definizione centrale che racchiude tutti i parametri possibili
 * per tutti i provider LLM supportati
 */
export interface ApiConfiguration {
  provider: LLMProviderId | string;
  apiKey?: string;
  modelId?: string;
  modelInfo?: OpenAiCompatibleModelInfo;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  customInstructions?: string;
  openAiApiKey?: string;
  openAiModelId?: string;
  openAiModelInfo?: OpenAiCompatibleModelInfo;
  openAiBaseUrl?: string;
  openAiNativeApiKey?: string;
  openRouterApiKey?: string;
  openRouterModelId?: string;
  openRouterModelInfo?: OpenAiCompatibleModelInfo;
  openRouterProviderSorting?: string | boolean;
  anthropicApiKey?: string;
  anthropicModelInfo?: OpenAiCompatibleModelInfo;
  anthropicBaseUrl?: string;
  anthropicModelId?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsRegion?: string;
  awsBedrockEndpoint?: string;
  awsUseCrossRegionInference?: boolean;
  awsBedrockUsePromptCache?: boolean;
  awsUseProfile?: boolean;
  awsProfile?: string;
  azureApiKey?: string;
  azureDeploymentId?: string;
  azureDeploymentName?: string;
  azureEndpoint?: string;
  azureApiVersion?: string;
  azureResourceName?: string;
  vertexProjectId?: string;
  vertexLocation?: string;
  vertexRegion?: string;
  geminiApiKey?: string;
  ollamaBaseUrl?: string;
  ollamaModelId?: string;
  ollamaApiOptionsCtxNum?: string;
  ollama?: {
    baseUrl?: string;
  };
  lmStudioBaseUrl?: string;
  lmStudioModelId?: string;
  lmStudio?: {
    baseUrl?: string;
  };
  mistralApiKey?: string;
  deepSeekApiKey?: string;
  requestyApiKey?: string;
  requestyModelId?: string;
  togetherApiKey?: string;
  togetherModelId?: string;
  qwenApiKey?: string;
  qwenApiLine?: string;
  vsCodeLmModelSelector?: any;
  liteLlmBaseUrl?: string;
  liteLlmModelId?: string;
  liteLlmApiKey?: string;
  o3MiniReasoningEffort?: string;
  asksageApiUrl?: string;
  asksageApiKey?: string;
  xaiApiKey?: string;
  sambanovaApiKey?: string;
  jarvisIdeApiKey?: string;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  thinkingBudgetTokens?: number;
  organization?: string;
  apiModelId?: string;
  telemetryEnabled?: boolean;
  model?: string;
}
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
export interface BetaImageBlockParam {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}
/**
 * Parametri per blocchi di immagini
 * Standardizzati qui per evitare duplicazioni in tutta l'applicazione
 */
export interface ImageBlockParam {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}
//# sourceMappingURL=api.types.d.ts.map
