/**
 * @file message.types.ts
 * @description Definizione centralizzata delle interfacce per i messaggi di chat
 * @version 1.0.0
 */

import type { ContentBlock, ContentType } from './chat.types';
import { createSafeMessage } from './message';

/**
 * Ruoli supportati per i messaggi di chat
 */
export type ChatRole = 'user' | 'assistant' | 'system' | 'function' | 'tool';

/**
 * Interfaccia per le statistiche di utilizzo dei token
 */
export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/**
 * Interfaccia per i metadati specifici del provider
 */
export interface ProviderFields {
  model?: string;
  stopReason?: string;
  usage?: TokenUsage;
  internalReasoning?: string;
  [key: string]: unknown;
}

/**
 * Interfaccia per i messaggi di chat
 * Questa è la definizione principale utilizzata in tutta l'applicazione
 */
export interface ChatMessage {
  /** Identificatore univoco del messaggio */
  readonly id?: string;
  /** Ruolo del mittente del messaggio */
  readonly role: ChatRole;
  /** Contenuto del messaggio (testo o contenuto multimodale) */
  content: string | ContentBlock[];
  /** Timestamp di creazione del messaggio (ISO string o numero) */
  readonly timestamp: number | string;
  /** Flag che indica se il messaggio è in fase di streaming */
  streaming?: boolean;
  /** Nome della funzione o strumento, se applicabile */
  readonly name?: string;
  /** Metadati specifici del provider */
  providerFields?: ProviderFields;
}

/**
 * Tipo per i messaggi di input parziali
 */
export type PartialChatMessage = Partial<ChatMessage> & {
  role: ChatRole;
  content: string | ContentBlock[];
};

/**
 * Funzione di utilità per convertire messaggi da altri formati a ChatMessage
 */
export function toChatMessage(message: PartialChatMessage): ChatMessage {
  if (!message.role || !message.content) {
    throw new TypeError('Message must have role and content');
  }

  return createSafeMessage({role: message.role, content: message.content, id: message.id, name: message.name, timestamp: message.timestamp || Date.now(), streaming: message.streaming || false, providerFields: message.providerFields});
}

/**
 * Funzione di utilità per normalizzare un array di messaggi al formato ChatMessage
 */
export function normalizeChatMessages(messages: PartialChatMessage[]): ChatMessage[] {
  return messages.map(toChatMessage);
}

/**
 * Funzione di utility per convertire string content a ContentBlock[]
 */
export function normalizeMessageContent(message: ChatMessage): ChatMessage {
  if (typeof message.content === 'string') {
    return {
      ...message,
      content: [
        {
          type: ContentType.Text,
          text: message.content.trim(),
        },
      ],
    };
  }
  return message;
}
