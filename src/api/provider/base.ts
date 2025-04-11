import type { ChatCompletionOptions, ChatCompletion, LLMProviderId, StreamChunk } from '../../types/global.js';
import type { ModelInfo } from '../../shared/types/api.types.js';
import { ApiProvider } from '../../agent/api/ApiProvider.js';

/**
 * Interfaccia base per un provider LLM
 * Ogni provider deve implementare questa interfaccia
 */
// La definizione di ApiProvider è stata spostata in src/agent/api/ApiProvider.ts
// export interface ApiProvider {
//   // Identificatore unico del provider
//   id: LLMProviderId;
//   
//   // Indica se il provider supporta lo streaming
//   supportsStream: boolean;
//   
//   // Genera una risposta in streaming
//   streamChat: (options: ChatCompletionOptions) => AsyncGenerator<StreamChunk>;
//   
//   // Genera una risposta non in streaming (opzionale)
//   chat?: (options: ChatCompletionOptions) => Promise<ChatCompletion>;
//   
//   // Restituisce informazioni sul modello usato
//   getModel(): { id: string; info: ModelInfo };
// }

/**
 * Opzioni di configurazione per un provider LLM
 */
export interface ProviderOptions {
  // Chiave API
  apiKey?: string;
  
  // ID del modello
  modelId?: string;
  
  // URL base per il provider (per API self-hosted)
  baseUrl?: string;
  
  // Impostazioni aggiuntive specifiche per ogni provider
  [key: string]: any;
}

/**
 * Provider che supporta il completamento di testo semplice
 */
export interface TextCompletionProvider extends ApiProvider {
  // Genera un completamento di testo dato un prompt
  complete: (prompt: string, options?: any) => Promise<string>;
} 