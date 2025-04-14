/**
 * @file message-adapter.ts
 * @description Adapter per unificare i tipi ChatMessage dalle diverse interfacce
 */

import { v4 as uuidv4 } from 'uuid';
import { ChatMessage as SharedChatMessage } from './message.types';
import { ChatMessage as ExtensionChatMessage } from '../types/extension';
import { ChatMessage as ChatTypesChatMessage, ContentBlock } from '../../src/shared/types/chat.types';
import { createChatMessage as createChatMessage } from "../../src/shared/types/chat.types";

/**
 * Funzione helper per creare un messaggio ChatMessage compatibile con tutte le interfacce
 * 
 * @param role Ruolo del messaggio ('user', 'assistant', 'system', ecc.)
 * @param content Contenuto del messaggio (stringa o array di ContentBlock)
 * @param options Opzioni aggiuntive
 * @returns Un oggetto ChatMessage compatibile con tutte le interfacce
 */
export function createSafeMessage(
  role: string, 
  content: string | ContentBlock[], 
  options?: {
    id?: string,
    name?: string,
    streaming?: boolean,
    timestamp?: number | string
  }
): SharedChatMessage & ExtensionChatMessage {
  const now = Date.now();
  const messageId = options?.id || uuidv4();
  
  return createChatMessage({role: role, content: content, id: messageId, timestamp: options?.timestamp || now, streaming: options?.streaming || false, name: options?.name}) as SharedChatMessage & ExtensionChatMessage;
}

/**
 * Verifica se un messaggio ha tutte le proprietà richieste
 * e aggiunge quelle mancanti con valori di default
 * 
 * @param message Messaggio da normalizzare
 * @returns Un messaggio compatibile con tutte le interfacce
 */
export function normalizeChatMessage(message: any): SharedChatMessage & ExtensionChatMessage {
  const normalized = { ...message };
  
  // Assicura presenza di id
  if (!normalized.id) {
    normalized.id = uuidv4();
  }
  
  // Assicura presenza di timestamp
  if (!normalized.timestamp) {
    normalized.timestamp = Date.now();
  }
  
  // Converte stringhe di timestamp a numeri se necessario
  if (typeof normalized.timestamp === 'string' && !isNaN(Date.parse(normalized.timestamp))) {
    normalized.timestamp = Date.parse(normalized.timestamp);
  }
  
  return normalized as SharedChatMessage & ExtensionChatMessage;
}

/**
 * Normalizza un array di messaggi chat
 */
export function normalizeMessages(messages: any[]): (SharedChatMessage & ExtensionChatMessage)[] {
  if (!Array.isArray(messages)) return [];
  return messages.map(normalizeChatMessage);
} 