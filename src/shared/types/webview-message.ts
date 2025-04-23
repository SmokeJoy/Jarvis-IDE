/**
 * webview-message.ts
 * Defines standardized message types for webview->extension communication
 * based on BaseMessage pattern
 */

import { BaseMessage, BasePayload } from './base-message';
import { PromptProfile } from './prompt';
import { ChatMessage, ContextPrompt } from './webview.types';

/**
 * Enum of all possible webview message types
 */
export enum WebviewMessageType {
  // General
  READY = 'ready',
  REQUEST = 'request',
  
  // Settings
  FETCH_SETTINGS = 'fetchSettings',
  UPDATE_SETTING = 'updateSetting',
  RESET_SETTINGS = 'resetSettings',
  
  // Chat
  SEND_CHAT_MESSAGE = 'sendChatMessage',
  FETCH_CHAT_HISTORY = 'fetchChatHistory',
  CLEAR_CHAT = 'clearChat',
  STOP_GENERATION = 'stopGeneration',
  
  // Model
  SELECT_MODEL = 'selectModel',
  FETCH_MODELS = 'fetchModels',
  
  // Context prompt
  UPDATE_CONTEXT_PROMPT = 'updateContextPrompt',
  FETCH_CONTEXT_PROMPT = 'fetchContextPrompt',
  
  // Prompt profiles
  CREATE_PROMPT_PROFILE = 'createPromptProfile',
  UPDATE_PROMPT_PROFILE = 'updatePromptProfile',
  DELETE_PROMPT_PROFILE = 'deletePromptProfile',
  FETCH_PROMPT_PROFILES = 'fetchPromptProfiles',
  
  // Agent commands
  AGENT_COMMAND = 'agentCommand',
  
  // Custom instructions
  UPDATE_CUSTOM_INSTRUCTIONS = 'updateCustomInstructions',
  FETCH_CUSTOM_INSTRUCTIONS = 'fetchCustomInstructions'
}

/**
 * Payloads for webview messages
 */
export interface ReadyPayload extends BasePayload {
  clientInfo?: {
    version: string;
    platform: string;
  };
}

export interface RequestPayload extends BasePayload {
  requestId: string;
  action: string;
  params?: Record<string, unknown>;
}

export interface UpdateSettingPayload extends BasePayload {
  key: string;
  value: any;
}

export interface SendChatMessagePayload extends BasePayload {
  message: ChatMessage;
  contextPrompt?: string;
}

export interface SelectModelPayload extends BasePayload {
  modelId: string;
  provider?: string;
}

export interface UpdateContextPromptPayload extends BasePayload {
  contextPrompt: ContextPrompt;
  threadId?: string;
}

export interface FetchContextPromptPayload extends BasePayload {
  threadId?: string;
}

export interface PromptProfilePayload extends BasePayload {
  profile: PromptProfile;
}

export interface DeletePromptProfilePayload extends BasePayload {
  profileId: string;
}

export interface AgentCommandPayload extends BasePayload {
  agentId: string;
  command: string;
  params?: Record<string, unknown>;
}

export interface UpdateCustomInstructionsPayload extends BasePayload {
  instructions: string;
}

/**
 * Union type for all Webview Messages
 */
export type WebviewPromptMessage =
  | BaseMessage<WebviewMessageType.READY, ReadyPayload>
  | BaseMessage<WebviewMessageType.REQUEST, RequestPayload>
  | BaseMessage<WebviewMessageType.FETCH_SETTINGS, BasePayload>
  | BaseMessage<WebviewMessageType.UPDATE_SETTING, UpdateSettingPayload>
  | BaseMessage<WebviewMessageType.RESET_SETTINGS, BasePayload>
  | BaseMessage<WebviewMessageType.SEND_CHAT_MESSAGE, SendChatMessagePayload>
  | BaseMessage<WebviewMessageType.FETCH_CHAT_HISTORY, BasePayload>
  | BaseMessage<WebviewMessageType.CLEAR_CHAT, BasePayload>
  | BaseMessage<WebviewMessageType.STOP_GENERATION, BasePayload>
  | BaseMessage<WebviewMessageType.SELECT_MODEL, SelectModelPayload>
  | BaseMessage<WebviewMessageType.FETCH_MODELS, BasePayload>
  | BaseMessage<WebviewMessageType.UPDATE_CONTEXT_PROMPT, UpdateContextPromptPayload>
  | BaseMessage<WebviewMessageType.FETCH_CONTEXT_PROMPT, FetchContextPromptPayload>
  | BaseMessage<WebviewMessageType.CREATE_PROMPT_PROFILE, PromptProfilePayload>
  | BaseMessage<WebviewMessageType.UPDATE_PROMPT_PROFILE, PromptProfilePayload>
  | BaseMessage<WebviewMessageType.DELETE_PROMPT_PROFILE, DeletePromptProfilePayload>
  | BaseMessage<WebviewMessageType.FETCH_PROMPT_PROFILES, BasePayload>
  | BaseMessage<WebviewMessageType.AGENT_COMMAND, AgentCommandPayload>
  | BaseMessage<WebviewMessageType.UPDATE_CUSTOM_INSTRUCTIONS, UpdateCustomInstructionsPayload>
  | BaseMessage<WebviewMessageType.FETCH_CUSTOM_INSTRUCTIONS, BasePayload>;

/**
 * Type guard to verify if a message is a WebviewPromptMessage
 */
export function isWebviewPromptMessage(message: unknown): message is WebviewPromptMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  
  const possibleMessage = message as Partial<WebviewPromptMessage>;
  
  if (typeof possibleMessage.type !== 'string' || !(msg.payload as unknown)) {
    return false;
  }
  
  // Verify the type is one of the WebviewMessageType values
  return Object.values(WebviewMessageType).includes(possibleMessage.type as WebviewMessageType);
}

/**
 * Type guards for specific message types
 */
export function isReadyMessage(message: WebviewPromptMessage): message is BaseMessage<WebviewMessageType.READY, ReadyPayload> {
  return message.type === WebviewMessageType.READY;
}

export function isRequestMessage(message: WebviewPromptMessage): message is BaseMessage<WebviewMessageType.REQUEST, RequestPayload> {
  return message.type === WebviewMessageType.REQUEST;
}

export function isSendChatMessageMessage(message: WebviewPromptMessage): message is BaseMessage<WebviewMessageType.SEND_CHAT_MESSAGE, SendChatMessagePayload> {
  return message.type === WebviewMessageType.SEND_CHAT_MESSAGE;
}

export function isUpdateContextPromptMessage(message: WebviewPromptMessage): message is BaseMessage<WebviewMessageType.UPDATE_CONTEXT_PROMPT, UpdateContextPromptPayload> {
  return message.type === WebviewMessageType.UPDATE_CONTEXT_PROMPT;
}

export function isAgentCommandMessage(message: WebviewPromptMessage): message is BaseMessage<WebviewMessageType.AGENT_COMMAND, AgentCommandPayload> {
  return message.type === WebviewMessageType.AGENT_COMMAND;
} 