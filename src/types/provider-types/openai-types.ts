/**
 * @file openai-types.ts
 * @description Definizione dei tipi specifici dell'API OpenAI usati nei transformer
 */

/**
 * Opzioni base per inizializzare un client OpenAI
 */
export interface OpenAIOptions {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Parametri per un messaggio in una richiesta di completamento chat
 */
export interface ChatCompletionMessageParam {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | ChatCompletionContentPart[];
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

/**
 * Parametri per un messaggio di sistema specifico
 */
export interface ChatCompletionSystemMessageParam extends ChatCompletionMessageParam {
  role: 'system';
}

/**
 * Parte di testo di un messaggio multimodale
 */
export interface ChatCompletionContentPartText {
  type: 'text';
  text: string;
}

/**
 * Parte immagine di un messaggio multimodale
 */
export interface ChatCompletionContentPartImage {
  type: 'image';
  image_url: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

/**
 * Tipo unione per le parti di contenuto
 */
export type ChatCompletionContentPart =
  | ChatCompletionContentPartText
  | ChatCompletionContentPartImage;

/**
 * Opzioni per una richiesta di completamento chat
 */
export interface ChatCompletionOptions {
  model: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: { [key: string]: number };
  user?: string;
  tools?: any[];
  tool_choice?: string | { type: string; function: { name: string } };
}

/**
 * Chunk ricevuto durante lo streaming di una risposta
 */
export interface ChatCompletionChunk {
  id: string;
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
      function_call?: { name?: string; arguments?: string };
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    index: number;
    finish_reason: string | null;
  }>;
  usage?: CompletionUsage;
}

/**
 * Informazioni sul consumo di token
 */
export interface CompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Risposta completa di completamento chat
 */
export interface ChatCompletion {
  id: string;
  choices: Array<{
    message: ChatCompletionMessageParam;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
    index: number;
  }>;
  model: string;
  usage?: CompletionUsage;
}

/**
 * Chiamata a tool/funzione in un messaggio
 */
export interface ChatCompletionMessageToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Stream di dati con supporto per abort controller
 */
export interface Stream<T> extends AsyncIterable<T> {
  controller: AbortController;
}
