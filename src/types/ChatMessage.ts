/**
 * @file ChatMessage.ts
 * @description Wrapper di retrocompatibilità che reindirizza alla definizione centralizzata
 * @version 1.0.0
 * @deprecated Usare l'importazione da "../shared/types/message.types.js" invece
 */

// Questo file è probabilmente obsoleto ora che ChatMessage è definito
// centralmente in src/shared/types/chat.types.ts

/* Commento il contenuto originale o lo elimino
import {
  ChatMessage as BaseChatMessage,
  ContentBlock,
  ContentType,
} from '../shared/types/chat.types'; // Percorso corretto

// ... eventuale logica specifica se presente ...
*/

import { ChatMessage as SharedChatMessage } from '../shared/types/chat.types';
import { sanitizeHtml } from '../shared/utils/sanitize';

/**
 * Represents a message in a chat conversation, potentially including sanitized content.
 * This type extends the shared ChatMessage type.
 */
export type ChatMessage = SharedChatMessage;

export { sanitizeHtml };

// Importa e ri-esporta direttamente i tipi necessari dalla definizione condivisa
export type {
  ChatMessage,
  ChatRole,
  ContentBlock,
  ContentType,
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
} from '../shared/types/chat.types';

// Importa e ri-esporta le funzioni utility dalla definizione condivisa
export {
  normalizeChatMessages,
  toChatMessage,
  createChatMessage,
} from '../shared/types/chat.types';
