import type { BaseMessage, ChatMessage } from "./message.js";
export type { BaseMessage, ChatMessage };
export interface ChatRequest {
    messages: ChatMessage[];
    stream?: boolean;
}
export interface ChatResponse {
    message: ChatMessage;
    error?: string;
}
export interface StreamResponse {
    chunk: string;
    error?: string;
}
export interface ErrorResponse {
    error: string;
}
//# sourceMappingURL=chat.d.ts.map