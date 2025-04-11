/**
 * @file api.types.ts
 * @description File di reindirizzamento per le definizioni dei tipi API
 * @deprecated Per nuovi sviluppi, importare direttamente da llm.types.ts
 */

// Importo tutti i tipi dal file centralizzato
import * as LLMTypes from './llm.types.js';
import { TelemetrySetting } from './telemetry.types.js';
import { ChatCompletionContentPart, ChatCompletionContentPartText, ChatCompletionContentPartImage } from './llm.types.js';

// Ri-esporto tutto per retrocompatibilità
export * from './llm.types.js';
export { TelemetrySetting };

// Tipo specifico per retrocompatibilità
export type AzureOpenAIDeploymentId = string;

/**
 * Per retrocompatibilità con il tipo OpenRouterModelInfo originale
 * @deprecated Usare OpenRouterModelInfo da provider.types.ts
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

// Definizioni condivise per i tipi API
// Questo file centralizza tutte le interfacce relative alle API per evitare duplicazioni e conflitti

/**
 * @file api.types.ts
 * @description Definizioni centralizzate dei tipi API per l'intero sistema
 */

/**
 * Interfaccia base per le informazioni di un modello
 */
export interface ModelInfoBase {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  maxTokens?: number;
  temperature?: number;
  description?: string;
}

/**
 * Interfaccia per modelli compatibili con OpenAI
 */
export interface OpenAiCompatibleModelInfo extends ModelInfoBase {
  provider: 'openai' | 'openrouter' | 'azure';
  apiVersion?: string;
  deploymentName?: string;
}

/**
 * Interfaccia per modelli Anthropic
 */
export interface AnthropicModelInfo extends ModelInfoBase {
  provider: 'anthropic';
  modelFamily: string;
  version: string;
}

/**
 * Interfaccia per modelli Mistral
 */
export interface MistralModelInfo extends ModelInfoBase {
  provider: 'mistral';
  modelFamily: string;
  version: string;
}

/**
 * Interfaccia per modelli Gemini
 */
export interface GeminiModelInfo extends ModelInfoBase {
  provider: 'gemini';
  modelFamily: string;
  version: string;
}

/**
 * Interfaccia per modelli Ollama
 */
export interface OllamaModelInfo extends ModelInfoBase {
  provider: 'ollama';
  modelFamily: string;
  version: string;
}

/**
 * Unione di tutti i tipi di modelli supportati
 */
export type ModelInfo = 
  | OpenAiCompatibleModelInfo
  | AnthropicModelInfo
  | MistralModelInfo
  | GeminiModelInfo
  | OllamaModelInfo;

/**
 * Interfaccia per modelli con fallback
 */
export interface ModelWithFallback<T extends ModelInfo> {
  model: T;
  fallback?: {
    id: string;
    name: string;
    contextLength: number;
  };
}

/**
 * Tipo per la configurazione dell'API
 */
export interface ApiConfiguration {
  provider: string;
  apiKey?: string;
  selectedModel: string;
  modelInfo?: ModelInfo;
  endpoint?: string;
  additionalHeaders?: Record<string, string>;
}

/**
 * Tipo per i messaggi di errore dell'API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Tipo per la risposta dell'API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Interfaccia base fondamentale per tutti i modelli LLM
 * Definisce le proprietà essenziali che TUTTI i modelli devono avere
 * @interface ModelInfoBase
 */
export interface ModelInfoBase {
  /** Identificatore univoco del modello (es: 'gpt-4', 'claude-3-opus') */
  id: string;

  /** Nome leggibile del modello */
  name: string;

  /** Provider del modello (es: 'openai', 'anthropic') */
  provider: LLMProviderId;

  /** 
   * Lunghezza massima del contesto supportata (in token)
   * Indica la quantità massima di token che il modello può processare in un singolo prompt
   */
  contextLength: number;
}

/**
 * Estende ModelInfoBase con capacità comuni tra vari modelli LLM
 * Queste proprietà sono opzionali ma standardizzate per facilitare funzionalità trasversali
 * @interface ModelInfoStandard
 * @extends ModelInfoBase
 */
export interface ModelInfoStandard extends ModelInfoBase {
  /** Token massimi in output che il modello può generare */
  maxTokens?: number;

  /** 
   * Dimensione finestra di contesto 
   * Spesso uguale a contextLength, ma può variare in alcuni modelli 
   */
  contextWindow?: number;

  /** 
   * Array di capacità supportate dal modello 
   * Utile per filtraggio e selezione modelli basati su feature
   */
  capabilities?: string[];

  /** Indica se il modello è di terze parti */
  isThirdParty?: boolean;

  /** Descrizione testuale del modello */
  description?: string;
  
  /** Temperatura predefinita consigliata per il modello */
  temperature?: number;
}

/**
 * Interfaccia per proprietà relative alla multimodalità e funzionalità avanzate
 * @interface ModelCapabilitiesInfo
 */
export interface ModelCapabilitiesInfo {
  /** Indica se il modello supporta input di immagini */
  supportsImages?: boolean;

  /** Indica se il modello supporta esecuzione di codice/calcoli */
  supportsComputerUse?: boolean;
  
  /** Indica se il modello supporta chiamate a funzioni/strumenti */
  supportsTools?: boolean;
  
  /** Indica se il modello supporta l'elaborazione di immagini (vision) */
  supportsVision?: boolean;
  
  /** Indica se il modello supporta il caching dei prompt */
  supportsPromptCache?: boolean;
}

/**
 * Interfaccia per informazioni di costo e pricing
 * @interface ModelPricingInfo
 */
export interface ModelPricingInfo {
  /** Prezzo per milione di token in input (in USD) */
  inputPrice?: number;
  
  /** Prezzo per milione di token in output (in USD) */
  outputPrice?: number;
  
  /** Prezzo per milione di token per scritture in cache (in USD) */
  cacheWritesPrice?: number;
  
  /** Prezzo per milione di token per letture da cache (in USD) */
  cacheReadsPrice?: number;
  
  /** 
   * Struttura prezzi alternativa 
   * @deprecated Preferire inputPrice e outputPrice direttamente nell'interfaccia 
   */
  pricing?: {
    input?: number;
    output?: number;
  };
}

/**
 * ModelInfo completo che combina tutte le interfacce precedenti
 * Questa è l'interfaccia principale usata in tutto il codice
 * @interface ModelInfo
 * @extends ModelInfoStandard
 * @extends ModelCapabilitiesInfo
 * @extends ModelPricingInfo
 */
export interface ModelInfo extends ModelInfoStandard, ModelCapabilitiesInfo, ModelPricingInfo {}

/**
 * Interfaccia specifica per modelli OpenRouter
 * @interface OpenRouterModelInfo
 * @extends ModelInfo
 */
export interface OpenRouterModelInfo extends ModelInfo {
  /** Timestamp di creazione del modello */
  created?: number;
  
  /** Punteggio di performance relativo */
  performanceScore?: number;
  
  /** Fornitore originale del modello */
  originalProvider?: string;
}

/**
 * Interfaccia specifica per modelli Azure OpenAI
 * @interface AzureOpenAIModelInfo
 * @extends OpenAiCompatibleModelInfo
 */
export interface AzureOpenAIModelInfo extends OpenAiCompatibleModelInfo {
  /** Deployment ID in Azure */
  deploymentId: string;
  
  /** Versione API di Azure OpenAI */
  apiVersion?: string;
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