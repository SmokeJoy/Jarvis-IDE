/**
 * Tipi di messaggi supportati tra Webview ed Estensione
 */
export type ExtensionMessageType =
  | 'log.update'
  | 'chat.update'
  | 'model.update'
  | 'settings.update'
  | 'error'
  | 'info';

/**
 * Interfaccia base per tutti i messaggi dell'estensione
 */
export interface BaseExtensionMessage {
  type: ExtensionMessageType;
  timestamp: number;
}

/**
 * Messaggio di aggiornamento log
 */
export interface LogUpdateMessage extends BaseExtensionMessage {
  type: 'log.update';
  payload: {
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    context?: Record<string, unknown>;
  };
}

/**
 * Messaggio di aggiornamento chat
 */
export interface ChatUpdateMessage extends BaseExtensionMessage {
  type: 'chat.update';
  payload: {
    threadId: string;
    messages: ChatMessage[];
    status: 'active' | 'completed' | 'error';
    error?: string;
  };
}

/**
 * Messaggio di aggiornamento modello
 */
export interface ModelUpdateMessage extends BaseExtensionMessage {
  type: 'model.update';
  payload: {
    modelId: string;
    modelInfo: ModelInfo;
    status: 'loading' | 'ready' | 'error';
    error?: string;
  };
}

/**
 * Messaggio di aggiornamento impostazioni
 */
export interface SettingsUpdateMessage extends BaseExtensionMessage {
  type: 'settings.update';
  payload: {
    settings: Partial<ExtensionSettings>;
  };
}

/**
 * Messaggio di errore
 */
export interface ErrorMessage extends BaseExtensionMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Messaggio informativo
 */
export interface InfoMessage extends BaseExtensionMessage {
  type: 'info';
  payload: {
    message: string;
    severity?: 'info' | 'warning' | 'success';
  };
}

/**
 * Unione di tutti i tipi di messaggi
 */
export type ExtensionMessage =
  | LogUpdateMessage
  | ChatUpdateMessage
  | ModelUpdateMessage
  | SettingsUpdateMessage
  | ErrorMessage
  | InfoMessage;

/**
 * Interfaccia per le impostazioni dell'estensione
 */
export interface ExtensionSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  enableNotifications: boolean;
  language: string;
  defaultModel: string;
  apiKeys: Record<string, string>;
}

/**
 * Interfaccia per i messaggi della chat
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface WebviewMessage {
  type: string;
  payload: unknown;
}

export interface McpToolCall {
  tool: string;
  args: unknown;
  requestId?: string;
}

export interface ToolResponse {
  success: boolean;
  output?: unknown;
  error?: string;
}

import { ExtensionConfig } from './config';
import { LLMResponse } from './llm';
import { ChatMessage } from './chat';
import { ModelInfo } from './model';

/**
 * Base message interface for all Jarvis messages
 */
export interface JarvisMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp?: number;
}

/**
 * Error message interface
 */
export interface ErrorMessage extends JarvisMessage<{
  error: string;
  stack?: string;
  code?: string;
}> {
  type: 'error';
}

/**
 * Init message interface
 */
export interface InitMessage extends JarvisMessage<{
  sessionId: string;
  timestamp: number;
  version?: string;
}> {
  type: 'init';
}

/**
 * Type guard for JarvisMessage
 */
export function isJarvisMessage<T = unknown>(value: unknown): value is JarvisMessage<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as JarvisMessage).type === 'string' &&
    'payload' in value
  );
}

/**
 * Type guard for ErrorMessage
 */
export function isErrorMessage(value: unknown): value is ErrorMessage {
  return (
    isJarvisMessage(value) &&
    value.type === 'error' &&
    typeof (msg.payload as unknown) === 'object' &&
    (msg.payload as unknown) !== null &&
    'error' in (msg.payload as unknown) &&
    typeof (msg.payload as unknown).error === 'string'
  );
}

/**
 * Type guard for InitMessage
 */
export function isInitMessage(value: unknown): value is InitMessage {
  return (
    isJarvisMessage(value) &&
    value.type === 'init' &&
    typeof (msg.payload as unknown) === 'object' &&
    (msg.payload as unknown) !== null &&
    'sessionId' in (msg.payload as unknown) &&
    'timestamp' in (msg.payload as unknown) &&
    typeof (msg.payload as unknown).sessionId === 'string' &&
    typeof (msg.payload as unknown).timestamp === 'number'
  );
}
