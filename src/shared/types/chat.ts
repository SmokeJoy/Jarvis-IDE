import { BaseMessage, ChatMessage } from './message';

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

/**
 * Represents a chat message
 */
export interface ChatMessage {
    /**
     * Unique identifier for the message
     */
    id: string;

    /**
     * Role of the message sender
     */
    role: 'user' | 'assistant' | 'system';

    /**
     * Content of the message
     */
    content: string;

    /**
     * Timestamp when the message was created
     */
    timestamp: number;

    /**
     * Optional metadata associated with the message
     */
    metadata?: Record<string, unknown>;
}

/**
 * Represents a chat thread
 */
export interface ChatThread {
    /**
     * Unique identifier for the thread
     */
    id: string;

    /**
     * Title of the thread
     */
    title: string;

    /**
     * Messages in the thread
     */
    messages: ChatMessage[];

    /**
     * Timestamp when the thread was created
     */
    createdAt: number;

    /**
     * Timestamp when the thread was last updated
     */
    updatedAt: number;

    /**
     * Optional metadata associated with the thread
     */
    metadata?: Record<string, unknown>;
}

/**
 * Chat history entry
 */
export interface ChatHistoryEntry {
    /**
     * Thread ID
     */
    threadId: string;

    /**
     * Thread title
     */
    title: string;

    /**
     * Last message in the thread
     */
    lastMessage: ChatMessage;

    /**
     * Number of messages in the thread
     */
    messageCount: number;

    /**
     * Timestamp when the thread was last updated
     */
    updatedAt: number;
}
