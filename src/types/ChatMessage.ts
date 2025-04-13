/**
 * @file ChatMessage.ts
 * @description Wrapper di retrocompatibilità che reindirizza alla definizione centralizzata
 * @version 1.0.0
 * @deprecated Usare l'importazione da "../shared/types/message.types.js" invece
 */

import {
  ChatMessage as ChatMessageType,
  normalizeChatMessages as normalizeMessages,
  toChatMessage,
} from '../shared/types/message.types';

// Esporta per retrocompatibilità
export type ChatMessage = ChatMessageType;
export const normalizeChatMessages = normalizeMessages;

// Re-esporta utility
export { toChatMessage };
