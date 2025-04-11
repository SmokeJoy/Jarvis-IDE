/**
 * @file message.types.ts
 * @description Definizione centralizzata delle interfacce per i messaggi di chat
 * @version 1.0.0
 */

import { ContentBlock, ContentType } from './chat.types.js';

/**
 * Interfaccia per i messaggi di chat
 * Questa è la definizione principale utilizzata in tutta l'applicazione
 */
export interface ChatMessage {
    /** Identificatore univoco del messaggio */
    id?: string;
    /** Ruolo del mittente del messaggio */
    role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
    /** Contenuto del messaggio (testo o contenuto multimodale) */
    content: string | ContentBlock[];
    /** Timestamp di creazione del messaggio (ISO string o numero) */
    timestamp: number | string;
    /** Flag che indica se il messaggio è in fase di streaming */
    streaming?: boolean;
    /** Nome della funzione o strumento, se applicabile */
    name?: string;
    /** Metadati specifici del provider */
    providerFields?: {
        model?: string;
        stopReason?: string;
        usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
        };
        internalReasoning?: string;
        [key: string]: any;
    };
}

/**
 * Funzione di utilità per convertire messaggi da altri formati a ChatMessage
 */
export function toChatMessage(message: any): ChatMessage {
    return {
        id: message.id,
        role: message.role,
        content: message.content || '',
        name: message.name,
        timestamp: message.timestamp || Date.now(),
        streaming: message.streaming || false,
        providerFields: message.providerFields
    };
}

/**
 * Funzione di utilità per normalizzare un array di messaggi al formato ChatMessage
 */
export function normalizeChatMessages(messages: any[]): ChatMessage[] {
    return messages.map(toChatMessage);
}

/**
 * Funzione di utility per convertire string content a ContentBlock[]
 */
export function normalizeMessageContent(message: ChatMessage): ChatMessage {
    if (typeof message.content === 'string') {
        return {
            ...message,
            content: [{ 
                type: ContentType.Text, 
                text: message.content 
            }]
        };
    }
    return message;
} 