/**
 * extension-message.ts
 * Defines standardized message types for extension->webview communication
 * based on BaseMessage pattern
 */

import { BaseMessage, BasePayload } from './base-message';
import { PromptProfile } from './prompt';
import { ApiConfiguration, ChatMessage, ContextPrompt, ExtensionState, SerializedSettings, SettingValue } from './webview.types';

/**
 * Enum of all possible extension message types
 */
export enum ExtensionMessageType {
  // Responses
  ERROR = 'error',
  RESPONSE = 'response',
  STATE = 'state',
  ACTION = 'action',
  
  // Prompt profiles
  PROMPT_PROFILES = 'promptProfiles',
  PROMPT_PROFILE_UPDATED = 'promptProfileUpdated',
  PROMPT_PROFILE_CREATED = 'promptProfileCreated',
  PROMPT_PROFILE_DELETED = 'promptProfileDeleted',
  
  // Settings
  SETTINGS_UPDATED = 'settingsUpdated',
  SETTINGS_RESET = 'settingsReset',
  
  // Chat
  CHAT_MESSAGE = 'chatMessage',
  CHAT_HISTORY = 'chatHistory',
  CHAT_CLEARED = 'chatCleared',
  
  // Agent status
  AGENT_STATUS = 'agentStatus',
  AGENT_RESULT = 'agentResult',
  
  // Custom instructions
  CUSTOM_INSTRUCTIONS = 'customInstructions',
  
  // Ready state
  READY = 'ready'
}

/**
 * Payloads for extension messages
 */
export interface ErrorPayload extends BasePayload {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ResponsePayload extends BasePayload {
  text?: string;
  role?: string;
  streaming?: boolean;
}

export interface StatePayload extends BasePayload {
  state: ExtensionState;
}

export interface ActionPayload extends BasePayload {
  action: string; 
}

export interface PromptProfilesPayload extends BasePayload {
  profiles: PromptProfile[];
}

export interface PromptProfilePayload extends BasePayload {
  profile: PromptProfile;
}

export interface SettingsUpdatedPayload extends BasePayload {
  settings: SerializedSettings;
}

export interface ChatMessagePayload extends BasePayload {
  message: ChatMessage;
}

export interface ChatHistoryPayload extends BasePayload {
  messages: ChatMessage[];
}

export interface AgentStatusPayload extends BasePayload {
  agentId: string;
  status: 'idle' | 'working' | 'error';
  message?: string;
}

export interface AgentResultPayload extends BasePayload {
  agentId: string;
  result: string;
  metadata?: Record<string, unknown>;
}

export interface CustomInstructionsPayload extends BasePayload {
  instructions: string;
}

/**
 * Union type for all Extension Messages
 */
export type ExtensionPromptMessage =
  | BaseMessage<ExtensionMessageType.ERROR, ErrorPayload>
  | BaseMessage<ExtensionMessageType.RESPONSE, ResponsePayload>
  | BaseMessage<ExtensionMessageType.STATE, StatePayload>
  | BaseMessage<ExtensionMessageType.ACTION, ActionPayload>
  | BaseMessage<ExtensionMessageType.PROMPT_PROFILES, PromptProfilesPayload>
  | BaseMessage<ExtensionMessageType.PROMPT_PROFILE_UPDATED, PromptProfilePayload>
  | BaseMessage<ExtensionMessageType.PROMPT_PROFILE_CREATED, PromptProfilePayload>
  | BaseMessage<ExtensionMessageType.PROMPT_PROFILE_DELETED, PromptProfilePayload>
  | BaseMessage<ExtensionMessageType.SETTINGS_UPDATED, SettingsUpdatedPayload>
  | BaseMessage<ExtensionMessageType.SETTINGS_RESET, BasePayload>
  | BaseMessage<ExtensionMessageType.CHAT_MESSAGE, ChatMessagePayload>
  | BaseMessage<ExtensionMessageType.CHAT_HISTORY, ChatHistoryPayload>
  | BaseMessage<ExtensionMessageType.CHAT_CLEARED, BasePayload>
  | BaseMessage<ExtensionMessageType.AGENT_STATUS, AgentStatusPayload>
  | BaseMessage<ExtensionMessageType.AGENT_RESULT, AgentResultPayload>
  | BaseMessage<ExtensionMessageType.CUSTOM_INSTRUCTIONS, CustomInstructionsPayload>
  | BaseMessage<ExtensionMessageType.READY, BasePayload>;

/**
 * Type guard to verify if a message is an ExtensionPromptMessage
 */
export function isExtensionPromptMessage(message: unknown): message is ExtensionPromptMessage {
  if (typeof message !== 'object' || message === null) {
    return false;
  }
  
  const possibleMessage = message as Partial<ExtensionPromptMessage>;
  
  if (typeof possibleMessage.type !== 'string' || !(msg.payload as unknown)) {
    return false;
  }
  
  // Verify the type is one of the ExtensionMessageType values
  return Object.values(ExtensionMessageType).includes(possibleMessage.type as ExtensionMessageType);
}

/**
 * Type guards for specific message types
 */
export function isErrorMessage(message: ExtensionPromptMessage): message is BaseMessage<ExtensionMessageType.ERROR, ErrorPayload> {
  return message.type === ExtensionMessageType.ERROR;
}

export function isResponseMessage(message: ExtensionPromptMessage): message is BaseMessage<ExtensionMessageType.RESPONSE, ResponsePayload> {
  return message.type === ExtensionMessageType.RESPONSE;
}

export function isStateMessage(message: ExtensionPromptMessage): message is BaseMessage<ExtensionMessageType.STATE, StatePayload> {
  return message.type === ExtensionMessageType.STATE;
}

export function isPromptProfilesMessage(message: ExtensionPromptMessage): message is BaseMessage<ExtensionMessageType.PROMPT_PROFILES, PromptProfilesPayload> {
  return message.type === ExtensionMessageType.PROMPT_PROFILES;
}

export function isPromptProfileUpdatedMessage(message: ExtensionPromptMessage): message is BaseMessage<ExtensionMessageType.PROMPT_PROFILE_UPDATED, PromptProfilePayload> {
  return message.type === ExtensionMessageType.PROMPT_PROFILE_UPDATED;
}

export function isAgentStatusMessage(message: ExtensionPromptMessage): message is BaseMessage<ExtensionMessageType.AGENT_STATUS, AgentStatusPayload> {
  return message.type === ExtensionMessageType.AGENT_STATUS;
}

export function isAgentResultMessage(message: ExtensionPromptMessage): message is BaseMessage<ExtensionMessageType.AGENT_RESULT, AgentResultPayload> {
  return message.type === ExtensionMessageType.AGENT_RESULT;
}
