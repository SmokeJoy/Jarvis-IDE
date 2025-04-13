/**
 * @file global.ts
 * @description Tipi globali centralizzati per l'applicazione
 * @version 1.0.0
 */

import { ChatCompletionMessageParam } from '../../types/provider-types/openai-types';
import { ChatMessage } from './message.types';
import { BaseMessage } from './message.types';

// Importa i tipi da llm.types.ts
import { LLMProviderId } from './llm.types';

// Importa ApiConfiguration dalla definizione centrale
import { ApiConfiguration } from './api.types';

// Re-esporta i tipi necessari usando export type
export type { LLMProviderId, BaseMessage, ApiConfiguration };

// Esporta gli altri tipi dal file centralizzato
export type { ChatCompletionMessageParam };

// ChatCompletionContentPart è stato spostato in api.types.ts
export type { ChatCompletionContentPartText, ChatCompletionContentPartImage } from './api.types';

// Rimuovo la definizione duplicata di ApiConfiguration, che ora viene importata da api.types.js
