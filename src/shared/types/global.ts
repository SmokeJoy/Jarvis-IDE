/**
 * @file global.ts
 * @description Tipi globali centralizzati per l'applicazione 
 * @version 1.0.0
 */

import type { ChatCompletionMessageParam } from "../../types/provider-types/openai-types.js.js"
import type { ChatMessage } from "./message.types.js.js"
import type { BaseMessage } from "./message.types.js.js"

// Importa i tipi da llm.types.ts
import type { 
  LLMProviderId 
} from "./llm.types.js.js"

// Importa ApiConfiguration dalla definizione centrale
import type { ApiConfiguration } from "./api.types.js.js"

// Re-esporta i tipi necessari usando export type
export type { LLMProviderId, BaseMessage, ApiConfiguration }

// Esporta gli altri tipi dal file centralizzato 
export type { ChatCompletionMessageParam }

// ChatCompletionContentPart è stato spostato in api.types.ts
export type { ChatCompletionContentPartText, ChatCompletionContentPartImage } from "./api.types.js.js"

// Rimuovo la definizione duplicata di ApiConfiguration, che ora viene importata da api.types.js 