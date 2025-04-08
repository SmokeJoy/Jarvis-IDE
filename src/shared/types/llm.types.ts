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
 * Interfaccia unificata per le configurazioni di provider API
 * Questa è la definizione centrale che racchiude tutti i parametri possibili
 * per tutti i provider LLM supportati
 */
export interface ApiConfiguration {
  // Proprietà generali
  provider: LLMProviderId | string;
  apiKey?: string;
  modelId?: string;
  modelInfo?: OpenAiCompatibleModelInfo;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  customInstructions?: string;
  
  // Proprietà OpenAI
  openAiApiKey?: string;
  openAiModelId?: string;
  openAiModelInfo?: OpenAiCompatibleModelInfo;
  openAiBaseUrl?: string;
  openAiNativeApiKey?: string;
  
  // Proprietà OpenRouter
  openRouterApiKey?: string;
  openRouterModelId?: string;
  openRouterModelInfo?: OpenAiCompatibleModelInfo;
  openRouterProviderSorting?: string | boolean;
  
  // Proprietà Anthropic
  anthropicApiKey?: string;
  anthropicModelInfo?: OpenAiCompatibleModelInfo;
  anthropicBaseUrl?: string;
  anthropicModelId?: string;

  // Proprietà AWS Bedrock
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
  
  // Proprietà Azure
  azureApiKey?: string;
  azureDeploymentId?: string;
  azureDeploymentName?: string;
  azureEndpoint?: string;
  azureApiVersion?: string;
  azureResourceName?: string;
  
  // Proprietà Vertex AI (Google)
  vertexProjectId?: string;
  vertexLocation?: string;
  vertexRegion?: string;
  
  // Proprietà Gemini
  geminiApiKey?: string;
  
  // Proprietà Ollama
  ollamaBaseUrl?: string;
  ollamaModelId?: string;
  ollamaApiOptionsCtxNum?: string;
  ollama?: {
    baseUrl?: string;
  };
  
  // Proprietà LM Studio
  lmStudioBaseUrl?: string;
  lmStudioModelId?: string;
  lmStudio?: {
    baseUrl?: string;
  };
  
  // Proprietà Mistral
  mistralApiKey?: string;
  
  // Proprietà DeepSeek
  deepSeekApiKey?: string;
  
  // Proprietà Requesty
  requestyApiKey?: string;
  requestyModelId?: string;
  
  // Proprietà Together
  togetherApiKey?: string;
  togetherModelId?: string;
  
  // Proprietà Qwen
  qwenApiKey?: string;
  qwenApiLine?: string;
  
  // Proprietà VSCode LM
  vsCodeLmModelSelector?: any;
  
  // Proprietà LiteLLM
  liteLlmBaseUrl?: string;
  liteLlmModelId?: string;
  liteLlmApiKey?: string;
  
  // Proprietà O1
  o3MiniReasoningEffort?: string;
  
  // Proprietà AskSage
  asksageApiUrl?: string;
  asksageApiKey?: string;
  
  // Proprietà XAI
  xaiApiKey?: string;
  
  // Proprietà Sambanow
  sambanovaApiKey?: string;
  
  // Proprietà Jarvis IDE
  jarvisIdeApiKey?: string;
  
  // Parametri di generazione
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  
  // Parametri avanzati
  thinkingBudgetTokens?: number;
  organization?: string;
  
  // Campi deprecati o di retrocompatibilità
  apiModelId?: string; // @deprecated Usare modelId
  telemetryEnabled?: boolean; // @deprecated Usare TelemetrySetting
  model?: string; // @deprecated Usare modelId
}