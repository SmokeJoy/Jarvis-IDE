/**
 * @file api.types.ts
 * @description Definizioni API specifiche. Tipi LLM comuni sono in llm.types.ts
 */

// Importo tipi necessari da altri moduli
import type { LLMProviderId, ModelInfo, MessageParam, ApiError as CommonApiError } from './llm.types'; // Importo LLMProviderId come tipo
import type { TelemetrySetting } from './telemetry.types';

export type { TelemetrySetting };

// Rimuovo definizioni duplicate o obsolete
// - OpenRouterModelInfo (obsoleta)
// - AzureOpenAIDeploymentId (usare string)
// - ModelInfoBase, ModelInfoStandard, ModelCapabilitiesInfo, ModelPricingInfo, ModelInfo (definite in llm.types o api.types)
// - OpenAiCompatibleModelInfo, AnthropicModelInfo, etc. (definite in llm.types o api.types)
// - ModelInfoUnion (definita in llm.types o api.types)
// - ApiConfiguration (definita in llm.types o api.types)
// - ApiError (usare quella da common.ts o llm.types.ts)
// - ApiResponse (usare quella da common.ts)
// - LLMProviderId (usare enum da llm.types.ts)
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
 * Opzioni per gli handler API
 */
export interface ApiHandlerOptions<TRequest = unknown, TResponse = unknown> {
  readonly timeout?: number;
  readonly transformer?: ApiTransformer<TRequest, TResponse>;
  readonly retryConfig?: {
    readonly maxRetries: number;
    readonly initialDelay: number;
    readonly maxDelay: number;
  };
}

// Tipi per lo streaming (potrebbero stare in llm.types.ts ma li lascio qui per ora)

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
 * Interfaccia per i componenti stream API
 */
export interface ApiStream {
  stream: ApiMessageGenerator;
}

// Rimuovo anche i re-export iniziali perché ora il file ha uno scopo più specifico
// export * from './llm.types';
