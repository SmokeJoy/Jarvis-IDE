/**
 * @file global.ts
 * @description Tipi globali centralizzati per l'applicazione 
 * @version 1.0.0
 */

import { ChatCompletionMessageParam } from "../../types/provider-types/openai-types.js"
import { ChatMessage } from "./message.types.js"
import { BaseMessage } from "./message.types.js"

// Importa i tipi da llm.types.ts
import { 
  LLMProviderId 
} from "./llm.types.js"

// Importa ApiConfiguration dalla definizione centrale
import { ApiConfiguration } from "./api.types.js"

// Re-esporta i tipi necessari usando export type
export type { LLMProviderId, BaseMessage, ApiConfiguration }

// Esporta gli altri tipi dal file centralizzato 
export type { ChatCompletionMessageParam }

// ChatCompletionContentPart è stato spostato in api.types.ts
export type { ChatCompletionContentPartText, ChatCompletionContentPartImage } from "./api.types.js"

// Rimuovo la definizione duplicata di ApiConfiguration, che ora viene importata da api.types.js 