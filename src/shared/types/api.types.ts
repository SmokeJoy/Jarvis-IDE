/**
 * @file api.types.ts
 * @description Definizioni API specifiche. Tipi LLM comuni sono in llm.types.ts
 */

// Importo tipi necessari da altri moduli
import type { LLMProviderId, ModelInfo as LLMModelInfo, MessageParam, ApiError as CommonApiError } from './llm.types'; // Importo LLMProviderId come tipo, Rinomino ModelInfo per evitare clash
import type { TelemetrySetting } from './telemetry.types';
import { z } from 'zod';

// Esporto i tipi importati che servono all'esterno
export type { LLMProviderId, LLMModelInfo, MessageParam, TelemetrySetting };

// Rimuovo definizioni duplicate o obsolete
// - OpenRouterModelInfo (obsoleta)
// - AzureOpenAIDeploymentId (usare string)
// - ModelInfoBase, ModelInfoStandard, ModelCapabilitiesInfo, ModelPricingInfo, ModelInfo (definite in llm.types o api.types)
// - OpenAiCompatibleModelInfo, AnthropicModelInfo, etc. (definite in llm.types o api.types)
// - ModelInfoUnion (definita in llm.types o api.types)
// - ApiConfiguration (definita in llm.types o api.types)
// - ApiError (usare quella da common.ts o llm.types.ts)
// - ApiResponse (usare quella da common.ts)
// - LLMProvider (definita in llm.types.ts)
// - MessageParam (definita in llm.types.ts)
// - ImageBlockParam (rimuovo duplicato)

// Mantengo tipi specifici per la gestione API (da verificare se ancora usati/necessari)

/**
 * Interfaccia per la trasformazione delle richieste e risposte API
 */
export interface ApiTransformer<TRequest = unknown, TResponse = unknown> {
  readonly transformRequest?: (request: TRequest) => TRequest;
  readonly transformResponse?: (response: TResponse) => TResponse;
  readonly transformError?: (error: CommonApiError) => CommonApiError; // Usa tipo errore comune
}

/**
 * Opzioni di base per gli handler API (da estendere per provider specifici)
 */
export interface ApiHandlerOptions {
  timeout?: number;
  transformer?: ApiTransformer;
  retryConfig?: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
  };
  // Campi comuni, ma le chiavi API e model ID dovrebbero stare nelle opzioni specifiche
  apiModelId?: string; // Potrebbe essere deprecato in favore di opzioni specifiche
  endpoint?: string; // Potrebbe essere deprecato
  apiKey?: string; // Generico, usare quello specifico del provider
}

// Tipi per lo streaming (potrebbero stare in llm.types.ts ma li lascio qui per ora)

/**
 * Struttura per un chunk di streaming di testo
 */
export interface ApiStreamTextChunk {
  type: 'text';
  content: string;
}

/**
 * Struttura per un chunk di streaming di reasoning
 */
export interface ApiStreamReasoningChunk {
  type: 'reasoning';
  reasoning: string;
}

/**
 * Struttura per un chunk di streaming con informazioni sull'utilizzo
 */
export interface ApiStreamUsageChunk {
  type: 'usage';
  usageData: {
    inputTokens: number;
    outputTokens: number;
    totalCost?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
}

/**
 * Generatore di messaggio per l'API
 */
export type ApiMessageGenerator = AsyncGenerator<
  ApiStreamTextChunk | ApiStreamReasoningChunk | ApiStreamUsageChunk
>;

/**
 * Interfaccia per i componenti stream API
 */
export interface ApiStream {
  type: 'stream';
  chunks: AsyncGenerator<ApiStreamChunk>;
}

export interface ApiStreamToolCallChunk {
  type: 'tool_call';
  toolName: string;
  input: unknown;
}

export type ApiStreamChunk =
  | ApiStreamTextChunk
  | ApiStreamReasoningChunk
  | ApiStreamUsageChunk
  | ApiStreamToolCallChunk;

export interface ApiError {
  type: 'error';
  message: string;
  code?: string;
  cause?: unknown;
}

// Definizione base per ApiConfiguration
export interface ApiConfiguration {
  modelId: string;
  apiKey?: string;
  apiHost?: string;
  organizationId?: string;
  [key: string]: unknown;
}

// Definizione base per ModelInfo
export interface ModelInfo {
  id: string;
  name: string;
  provider: string; // Potrebbe usare LLMProviderId
  contextSize?: number;
  maxOutputTokens?: number;
  supportsStreaming?: boolean;
  supportsFunctions?: boolean;
  tags?: string[];
}

// Interfaccia specifica per modelli compatibili OpenAI (potrebbe estendere ModelInfo)
export interface OpenAiCompatibleModelInfo extends ModelInfo {
  // Aggiungere proprietà specifiche se ci sono, es:
  // apiVersion?: string;
  // deploymentId?: string; // Per Azure
}

/**
 * Tipi per l'API di Jarvis
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  temperature?: number;
  baseUrl?: string;
}

export enum LLMProviderId {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
  Local = 'local'
}

export interface APIConfiguration {
  provider: string;
  apiKey: string;
  modelId: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

// API Message Types Enum
export enum ApiMessageType {
  // Configuration
  SET_CONFIGURATION = 'set_configuration',
  GET_CONFIGURATION = 'get_configuration',
  
  // Models
  LOAD_MODELS = 'load_models',
  FETCH_MODELS = 'fetch_models',
  CLEAR_MODEL_CACHE = 'clear_model_cache',
  
  // Chat/Messages
  SEND_MESSAGE = 'send_message',
  RESET = 'reset',
  
  // Navigation/UI
  NAVIGATE = 'navigate',
  OPEN_ROUTE = 'open_route',
  TOGGLE_SIDEBAR = 'toggle_sidebar', 
  TOGGLE_TERMINAL = 'toggle_terminal',
  SET_THEME = 'set_theme',
  SET_FONT_SIZE = 'set_font_size',
  
  // Prompt Profiles
  PROMPT_PROFILES = 'prompt_profiles',
  PROMPT_PROFILE_UPDATED = 'prompt_profile_updated',
  
  // Telemetry
  TELEMETRY_ERROR = 'telemetry_error',
  TELEMETRY_EVENT = 'telemetry_event',
  TELEMETRY_METRIC = 'telemetry_metric',
  
  // Errors
  API_ERROR = 'api_error'
}

// Base Message Interface
export interface ApiMessageBase<T extends ApiMessageType> {
  type: T;
  payload: Record<string, unknown>;
  error?: string;
  timestamp?: number;
}

// Configuration Messages
export interface SetConfigurationMessage extends ApiMessageBase<ApiMessageType.SET_CONFIGURATION> {
  payload: {
    config: APIConfiguration;
  };
}

export interface GetConfigurationMessage extends ApiMessageBase<ApiMessageType.GET_CONFIGURATION> {
  payload: Record<string, never>;
}

// Model Messages
export interface LoadModelsMessage extends ApiMessageBase<ApiMessageType.LOAD_MODELS> {
  payload: {
    models: ModelInfo[];
  };
}

export interface FetchModelsMessage extends ApiMessageBase<ApiMessageType.FETCH_MODELS> {
  payload: {
    force?: boolean;
  };
}

export interface ClearModelCacheMessage extends ApiMessageBase<ApiMessageType.CLEAR_MODEL_CACHE> {
  payload: Record<string, never>;
}

// Chat Messages
export interface SendMessageMessage extends ApiMessageBase<ApiMessageType.SEND_MESSAGE> {
  payload: {
    message: string;
    modelId?: string;
    apiKey?: string;
  };
}

export interface ResetMessage extends ApiMessageBase<ApiMessageType.RESET> {
  payload: Record<string, never>;
}

// Navigation/UI Messages
export interface NavigateMessage extends ApiMessageBase<ApiMessageType.NAVIGATE> {
  payload: {
    route: string;
    params?: Record<string, unknown>;
  };
}

export interface OpenRouteMessage extends ApiMessageBase<ApiMessageType.OPEN_ROUTE> {
  payload: {
    route: string;
  };
}

export interface ToggleSidebarMessage extends ApiMessageBase<ApiMessageType.TOGGLE_SIDEBAR> {
  payload: {
    visible: boolean;
  };
}

export interface ToggleTerminalMessage extends ApiMessageBase<ApiMessageType.TOGGLE_TERMINAL> {
  payload: {
    visible: boolean;
  };
}

export interface SetThemeMessage extends ApiMessageBase<ApiMessageType.SET_THEME> {
  payload: {
    theme: 'light' | 'dark';
  };
}

export interface SetFontSizeMessage extends ApiMessageBase<ApiMessageType.SET_FONT_SIZE> {
  payload: {
    size: number;
  };
}

// Prompt Profile Messages
export interface PromptProfilesMessage extends ApiMessageBase<ApiMessageType.PROMPT_PROFILES> {
  payload: {
    profiles: PromptProfile[];
  };
}

export interface PromptProfileUpdatedMessage extends ApiMessageBase<ApiMessageType.PROMPT_PROFILE_UPDATED> {
  payload: {
    profile: PromptProfile;
  };
}

// Telemetry Messages
export interface TelemetryErrorMessage extends ApiMessageBase<ApiMessageType.TELEMETRY_ERROR> {
  payload: {
    error: string;
    details?: Record<string, unknown>;
  };
}

export interface TelemetryEventMessage extends ApiMessageBase<ApiMessageType.TELEMETRY_EVENT> {
  payload: {
    event: string;
    properties?: Record<string, unknown>;
  };
}

export interface TelemetryMetricMessage extends ApiMessageBase<ApiMessageType.TELEMETRY_METRIC> {
  payload: {
    name: string;
    value: number;
    tags?: Record<string, string>;
  };
}

// Error Messages
export interface ApiErrorMessage extends ApiMessageBase<ApiMessageType.API_ERROR> {
  payload: {
    error: string;
    details?: unknown;
  };
}

// Union type for all API messages
export type ApiMessageUnion =
  | SetConfigurationMessage
  | GetConfigurationMessage
  | LoadModelsMessage
  | FetchModelsMessage
  | ClearModelCacheMessage
  | SendMessageMessage
  | ResetMessage
  | NavigateMessage
  | OpenRouteMessage
  | ToggleSidebarMessage
  | ToggleTerminalMessage
  | SetThemeMessage
  | SetFontSizeMessage
  | PromptProfilesMessage
  | PromptProfileUpdatedMessage
  | TelemetryErrorMessage
  | TelemetryEventMessage
  | TelemetryMetricMessage
  | ApiErrorMessage;

// Type alias for any API message
export type ApiMessage = ApiMessageUnion;

// Helper type to extract payload type from message type
export type ApiMessagePayload<T extends ApiMessageType> = Extract<ApiMessageUnion, { type: T }>['payload'];

// Helper type to extract message interface from message type
export type ApiMessageInterface<T extends ApiMessageType> = Extract<ApiMessageUnion, { type: T }>;
