/**
 * @file webview.ts - File di compatibilità per il tipo WebviewMessage
 * @description Questo file esporta le definizioni dal file centralizzato di tipi
 */
import type { WebviewMessage as GenericWebviewMessage } from '../types/webview.types.js';
export type WebviewMessage<T = any> = GenericWebviewMessage<T>;
export type WebviewMessagePayload<T = any> = T;
export type WebviewSettings = import('../types/webview.types').WebviewSettings;
export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}
export interface WebviewState {
    messages: ChatMessage[];
    theme: "light" | "dark";
    configuration: WebviewConfiguration;
}
export interface WebviewConfiguration {
    apiKey?: string;
    model?: string;
    temperature?: number;
}
export type WebviewCommand = "send" | "clear" | "configure";
//# sourceMappingURL=webview.d.ts.map