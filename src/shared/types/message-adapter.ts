/**
 * @file message-adapter.ts
 * @description Adapter per unificare i tipi ChatMessage dalle diverse interfacce
 */

import { v4 as uuidv4 } from 'uuid';
import { ChatMessage as SharedChatMessage } from './message.types';
import { ChatMessage as ExtensionChatMessage } from '../types/extension';
import { ChatMessage as ChatTypesChatMessage, ContentBlock } from '../../src/shared/types/chat.types';
import { createChatMessage as createChatMessage } from "../../src/shared/types/chat.types";
import { type AgentMessageUnion } from './mas-message';
import { type WebSocketMessageUnion } from './websocketMessageUnion';
import { type WebviewMessageUnion } from './webview-message';
import { type ExtensionPromptMessage } from './prompt-message';

/**
 * Union of all message types supported by the bridge adapters
 * This allows strongly typed message handling across different system boundaries
 */
export type SupportedMessageUnion = 
  | WebSocketMessageUnion 
  | WebviewMessageUnion 
  | AgentMessageUnion
  | ExtensionPromptMessage;

/**
 * Type guard to check if a message is of a specific type
 * @param message The message to check
 * @param messageType The type to check for
 * @returns True if the message is of the specified type
 */
export function isMessageOfType<T extends SupportedMessageUnion>(
  message: unknown, 
  messageType: string
): message is T {
  return (
    typeof message === 'object' && 
    message !== null && 
    'type' in message && 
    typeof message.type === 'string' && 
    message.type === messageType
  );
}

/**
 * Helper function to get the type of a message safely
 * @param message The message to get the type from
 * @returns The message type or undefined if invalid
 */
export function getMessageType(message: unknown): string | undefined {
  if (
    typeof message === 'object' && 
    message !== null && 
    'type' in message && 
    typeof (message as { type: unknown }).type === 'string'
  ) {
    return (message as { type: string }).type;
  }
  return undefined;
}

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