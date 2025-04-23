/**
 * @file WebviewMessage.ts
 * @description Definizioni di tipo per i messaggi scambiati tra WebView ed Extension
 */

/**
 * Enumerazione dei tipi di messaggi che possono essere inviati da WebView a Extension
 */
export enum WebviewToExtensionMessageType {
  // Messaggi di configurazione
  GET_SETTINGS = 'getSettings',
  UPDATE_SETTINGS = 'updateSettings',
  
  // Messaggi relativi a LLM/AI
  SEND_PROMPT = 'sendPrompt',
  CANCEL_REQUEST = 'cancelRequest',
  
  // Messaggi per la gestione della chat
  CLEAR_CHAT = 'clearChat',
  SAVE_CHAT = 'saveChat',
  LOAD_CHAT = 'loadChat',
  
  // Altri messaggi di controllo
  GET_WORKSPACE_INFO = 'getWorkspaceInfo',
  RUN_COMMAND = 'runCommand',
  RELOAD_WEBVIEW = 'reloadWebview',
}

/**
 * Enumerazione dei tipi di messaggi che possono essere inviati da Extension a WebView
 */
export enum ExtensionToWebviewMessageType {
  // Risposte a richieste di configurazione
  SETTINGS_RESPONSE = 'settingsResponse',
  
  // Messaggi relativi a LLM/AI
  MODEL_RESPONSE = 'modelResponse',
  MODEL_ERROR = 'modelError',
  MODEL_START = 'modelStart',
  MODEL_END = 'modelEnd',
  MODEL_THINKING = 'modelThinking',
  
  // Messaggi relativi alla chat
  CHAT_LOADED = 'chatLoaded',
  CHAT_SAVED = 'chatSaved',
  
  // Altri messaggi informativi
  NOTIFICATION = 'notification',
  WORKSPACE_INFO = 'workspaceInfo',
  COMMAND_RESULT = 'commandResult',
}

/**
 * Interfaccia base per tutti i messaggi WebView
 */
export interface WebviewMessage<T = unknown> {
  type: string;
  payload?: T;
  error?: string;
}

/**
 * Tipo per i messaggi da WebView a Extension
 */
export type WebviewToExtensionMessage = 
  | GetSettingsMessage
  | UpdateSettingsMessage
  | SendPromptMessage
  | CancelRequestMessage
  | ClearChatMessage
  | SaveChatMessage
  | LoadChatMessage
  | GetWorkspaceInfoMessage
  | RunCommandMessage
  | ReloadWebviewMessage;

/**
 * Tipo per i messaggi da Extension a WebView
 */
export type ExtensionToWebviewMessage =
  | SettingsResponseMessage
  | ModelResponseMessage
  | ModelErrorMessage 
  | ModelStartMessage
  | ModelEndMessage
  | ModelThinkingMessage
  | ChatLoadedMessage
  | ChatSavedMessage
  | NotificationMessage
  | WorkspaceInfoMessage
  | CommandResultMessage;

// Interfacce per i messaggi specifici da WebView a Extension

export interface GetSettingsMessage extends WebviewMessage {
  type: WebviewToExtensionMessageType.GET_SETTINGS;
}

export interface UpdateSettingsMessage extends WebviewMessage<{
  settings: Record<string, unknown>;
}> {
  type: WebviewToExtensionMessageType.UPDATE_SETTINGS;
}

export interface SendPromptMessage extends WebviewMessage<{
  prompt: string;
  options?: Record<string, unknown>;
}> {
  type: WebviewToExtensionMessageType.SEND_PROMPT;
}

export interface CancelRequestMessage extends WebviewMessage {
  type: WebviewToExtensionMessageType.CANCEL_REQUEST;
}

export interface ClearChatMessage extends WebviewMessage {
  type: WebviewToExtensionMessageType.CLEAR_CHAT;
}

export interface SaveChatMessage extends WebviewMessage<{
  name?: string;
}> {
  type: WebviewToExtensionMessageType.SAVE_CHAT;
}

export interface LoadChatMessage extends WebviewMessage<{
  id: string;
}> {
  type: WebviewToExtensionMessageType.LOAD_CHAT;
}

export interface GetWorkspaceInfoMessage extends WebviewMessage {
  type: WebviewToExtensionMessageType.GET_WORKSPACE_INFO;
}

export interface RunCommandMessage extends WebviewMessage<{
  command: string;
  args?: unknown[];
}> {
  type: WebviewToExtensionMessageType.RUN_COMMAND;
}

export interface ReloadWebviewMessage extends WebviewMessage {
  type: WebviewToExtensionMessageType.RELOAD_WEBVIEW;
}

// Interfacce per i messaggi specifici da Extension a WebView

export interface SettingsResponseMessage extends WebviewMessage<{
  settings: Record<string, unknown>;
}> {
  type: ExtensionToWebviewMessageType.SETTINGS_RESPONSE;
}

export interface ModelResponseMessage extends WebviewMessage<{
  text: string;
  messageId: string;
  isComplete?: boolean;
}> {
  type: ExtensionToWebviewMessageType.MODEL_RESPONSE;
}

export interface ModelErrorMessage extends WebviewMessage<{
  message: string;
  details?: Record<string, unknown>;
}> {
  type: ExtensionToWebviewMessageType.MODEL_ERROR;
}

export interface ModelStartMessage extends WebviewMessage<{
  messageId: string;
  prompt?: string;
}> {
  type: ExtensionToWebviewMessageType.MODEL_START;
}

export interface ModelEndMessage extends WebviewMessage<{
  messageId: string;
  duration?: number;
}> {
  type: ExtensionToWebviewMessageType.MODEL_END;
}

export interface ModelThinkingMessage extends WebviewMessage<{
  messageId: string;
  thought: string;
}> {
  type: ExtensionToWebviewMessageType.MODEL_THINKING;
}

export interface ChatLoadedMessage extends WebviewMessage<{
  id: string;
  name: string;
  messages: unknown[];
}> {
  type: ExtensionToWebviewMessageType.CHAT_LOADED;
}

export interface ChatSavedMessage extends WebviewMessage<{
  id: string;
  name: string;
}> {
  type: ExtensionToWebviewMessageType.CHAT_SAVED;
}

export interface NotificationMessage extends WebviewMessage<{
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}> {
  type: ExtensionToWebviewMessageType.NOTIFICATION;
}

export interface WorkspaceInfoMessage extends WebviewMessage<{
  name: string;
  path: string;
  files?: number;
  folders?: number;
}> {
  type: ExtensionToWebviewMessageType.WORKSPACE_INFO;
}

export interface CommandResultMessage extends WebviewMessage<{
  command: string;
  result: unknown;
  success: boolean;
}> {
  type: ExtensionToWebviewMessageType.COMMAND_RESULT;
} 