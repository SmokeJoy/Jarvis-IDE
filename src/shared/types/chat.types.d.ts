/**
 * @file chat.types.ts
 * @description Definizione centralizzata per tipi di messaggi chat e contenuti multimodali
 */
import type { ChatSettings } from './user-settings.types.js.js';
import type { ChatCompletionContentPart, ChatCompletionContentPartText, ChatCompletionContentPartImage } from './llm.types.js.js';
export type { ChatSettings };
export type { ChatCompletionContentPart, ChatCompletionContentPartText, ChatCompletionContentPartImage };
/**
 * Tipo di contenuto supportato nei messaggi multimodali
 */
export declare enum ContentType {
    Text = "text",
    Image = "image_url",
    ToolUse = "tool_use",
    ToolResult = "tool_result"
}
/**
 * Blocco di testo per un messaggio
 */
export interface TextBlock {
    type: ContentType.Text;
    text: string;
}
/**
 * Blocco immagine per un messaggio
 */
export interface ImageBlock {
    type: ContentType.Image;
    url?: string;
    base64Data?: string;
    media_type?: string;
}
/**
 * Blocco generico per uso di strumenti
 */
export interface ToolUseBlock {
    type: ContentType.ToolUse;
    id: string;
    name: string;
    input: Record<string, any>;
}
/**
 * Blocco generico per risultati di strumenti
 */
export interface ToolResultBlock {
    type: ContentType.ToolResult;
    toolUseId: string;
    content: string | Record<string, any>;
}
/**
 * Tipo unione per tutti i possibili blocchi di contenuto
 */
export type ContentBlock = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock;
/**
 * Rappresenta un messaggio di chat standard utilizzato in tutti i provider
 */
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
    content: ContentBlock[] | string;
    timestamp: string;
    name?: string;
    providerFields?: {
        model?: string;
        stopReason?: string;
        usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
        };
        internalReasoning?: string;
    };
}
/**
 * Funzione di utility per normalizzare un messaggio
 */
export declare function normalizeMessage(message: ChatMessage): ChatMessage;
//# sourceMappingURL=chat.types.d.ts.map