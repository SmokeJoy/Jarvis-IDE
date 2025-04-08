/**
 * @file global.ts
 * @description Tipi globali centralizzati per l'applicazione 
 * @version 1.0.0
 */

import type { ChatCompletionMessageParam } from "../../types/provider-types/openai-types.js"
import type { ChatMessage } from "./message.types.js"
import type { BaseMessage } from "./message.types.js"

// Importa i tipi da llm.types.ts
import type { 
  LLMProviderId 
} from "./llm.types.js"

// Importa ApiConfiguration dalla definizione centrale
import type { ApiConfiguration } from "./api.types.js"

// Re-esporta i tipi necessari usando export type
export type { LLMProviderId, BaseMessage, ApiConfiguration }

// Esporta gli altri tipi dal file centralizzato 
export type { ChatCompletionMessageParam }

// ChatCompletionContentPart è stato spostato in api.types.ts
export type { ChatCompletionContentPartText, ChatCompletionContentPartImage } from "./api.types.js"

// Rimuovo la definizione duplicata di ApiConfiguration, che ora viene importata da api.types.js 