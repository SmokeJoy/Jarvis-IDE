/**
 * @file ChatContent.ts
 * @description Tipi e utilità per la gestione dei contenuti di chat
 */

import { normalizeContentBlock } from "./ChatContentHelpers.js";

// Importiamo i tipi e li esportiamo correttamente
import type { ChatMessage, ContentBlock } from "./types/chat.types.js";
import type { ContentType } from "./types/chat.types.js";

// Ri-esporta i tipi usando export type
export type { ChatMessage, ContentBlock };

/**
 * Interfaccia per rappresentare il contenuto di una chat
 */
export interface ChatContent {
	/**
	 * Messaggi nella conversazione
	 */
	messages: ChatMessage[];
}

/**
 * Normalizza un oggetto ChatContent
 * @param content Il contenuto da normalizzare
 * @returns Il contenuto normalizzato con tutti i blocchi in formato standard
 */
export function normalizeChatContent(content: ChatContent): ChatContent {
	return {
		messages: content.messages.map(message => ({
			...message,
			content: Array.isArray(message.content)
				? message.content.map(normalizeContentBlock)
				: [normalizeContentBlock({ type: ContentType.Text, text: message.content as string })]
		}))
	};
}
