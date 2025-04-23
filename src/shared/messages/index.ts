/**
 * @file messages/index.ts
 * @description Barrel file centralizzato per tutti i tipi di messaggi e guard - Jarvis IDE
 * Questo file è il punto di ingresso unico per importare tutto ciò che riguarda i messaggi
 */

// Tipi base e utilità
export { type BaseMessage, isMessageOfType } from '../types/message-utils';
export { type BasePayload, isBaseMessage } from '../types/base-message';
export * from '../types/common';
export * from '../types/api.types';
export * from '../types/global';
export * from '../types/message.types';
export * from '../types/session';
export * from '../types/test-utils.types';

// Tipi e guard per i messaggi dell'estensione
export * from './extension-messages';

export * from '../types/extensionMessageUnion';

// Tipi e guard per i messaggi della webview
export {
  type WebviewPromptMessage,
  type WebviewMessage,
  type ReadyPayload,
  type RequestPayload,
  type UpdateSettingPayload,
  type SendChatMessagePayload,
  type SelectModelPayload,
  type UpdateContextPromptPayload,
  type FetchContextPromptPayload,
  type PromptProfilePayload as WebviewPromptProfilePayload,
  type DeletePromptProfilePayload,
  type AgentCommandPayload,
  type UpdateCustomInstructionsPayload,
  isWebviewPromptMessage,
  isWebviewMessage,
  isReadyMessage,
  isRequestMessage,
  isSendChatMessageMessage,
  isUpdateContextPromptMessage,
  isAgentCommandMessage
} from '../types/webview-message';

export * from '../types/webviewMessageUnion';
export * from '../types/webview-message-guards';

// Tipi e guard per i messaggi MAS
export {
  type AgentMessageUnion,
  isAgentMessage,
  type GetAgentsStatusMessage,
  type GetTaskQueueStatusMessage,
  type SendCoderInstructionMessage,
  type AbortCoderInstructionMessage,
  type ToggleAgentActiveMessage,
  type SetAgentModeMessage,
  type SetAgentStyleMessage,
  type SetSystemModeMessage,
  type SetDefaultStyleMessage,
  type GetMasConfigurationMessage,
  type AbortTaskMessage,
  type RerunTaskMessage,
  type SetTaskQueueFilterMessage,
  type PromptProfile,
  type ContextPrompt,
  type WebviewPromptMessage
} from '../types/mas-message';

export * from '../types/mas-message-guards';

// Messaggi MAS unificati
export {
  type MasMessageUnion,
  type AgentTypingMessage,
  type AgentTypingDoneMessage,
  type AgentStatusUpdateMessage,
  type LlmCancelMessage as MasLlmCancelMessage,
  isMasMessage,
  isAgentTypingMessage,
  isAgentTypingDoneMessage,
  isAgentStatusUpdateMessage,
  isMasLlmCancelMessage
} from '../types/masMessageUnion';

// Messaggi WebSocket
export {
  type WebSocketMessageUnion,
  type PingMessage,
  type PongMessage,
  type WebSocketErrorMessage,
  type DisconnectMessage,
  type LlmStatusMessage,
  type LlmCancelMessage,
  isWebSocketMessage,
  isPingMessage,
  isPongMessage,
  isWebSocketErrorMessage,
  isDisconnectMessage,
  isLlmStatusMessage,
  isLlmCancelMessage
} from '../types/websocketMessageUnion';

// Guard generiche
export {
  isWebviewMessageUnknown,
  isWebviewMessageOfType,
  type WebviewMessageUnknown
} from '../types/guards';

// Tipi comuni condivisi
export type { PromptProfile } from '../types/prompt';
export type { 
  ContextPrompt, 
  ChatMessage, 
  ExtensionState, 
  SerializedSettings, 
  SettingValue 
} from '../types/webview.types';

// Tipi per il motore di prompt
export type { PromptRunMode, PromptResult } from '../types/prompt-engine.types';
export * from '../types/promptStrategy';

// Tipi per l'adapter dei messaggi
export { type SupportedMessageUnion } from '../types/message-adapter';
export * from '../types/message-union';

// Nuovi tipi MAS/MCP
export type { 
  McpConfiguration,
  McpState,
  McpAgent,
  McpTask,
  McpMode
} from '../types/mcp.types';

export type {
  MasConfiguration,
  MasState,
  MasAgent,
  MasTask
} from '../types/mas.types';

export * from '../types/mcp-connection-message';
export * from '../types/provider-message';
export * from '../types/strategy-message';
export * from '../types/telemetry-message';
export * from '../types/blacklist-message';
export * from '../types/audit-message';
export * from '../types/fallback-message';
export * from '../types/prompt-history-message';
export * from '../types/prompt-message';

// Tipi per provider e LLM
export type {
  LlmProvider,
  LlmModel,
  LlmConfiguration,
  LlmResponse
} from '../types/llm.types';

export type {
  ProviderConfiguration,
  ProviderState,
  ProviderCapabilities
} from '../types/provider.types';

export * from '../types/provider-stats';
export * from '../types/providers.types';

// Tipi per profili e autenticazione
export * from '../types/profile-message';
export * from '../types/profile-message-guards';
export * from '../types/auth-message';
export * from '../types/auth-message-guards';

// Tipi per telemetria e impostazioni utente
export type {
  TelemetryEvent,
  TelemetryData,
  TelemetryConfiguration
} from '../types/telemetry.types';

export type {
  UserSettings,
  UserPreferences,
  UserConfiguration
} from '../types/user-settings.types';

// Tipi per gestione immagini
export type {
  ImageData,
  ImageMetadata,
  ImageConfiguration
} from '../types/image.types';

export type {
  ImageBlock,
  ImageSource,
  Base64ImageSource,
  URLImageSource,
  BaseImageSource
} from '../types/chat.types';

// Tipi per contesto e code di task
export * from '../types/context.types';
export * from '../types/task-queue.types';

// Barrel messages
export * from '../types/messages-barrel';

// Esporta i tipi base dei messaggi
export type {
  Message,
  BaseMessage,
  ExtensionMessage,
  WebviewMessage,
  MessagePayload,
  MessageError
} from './messages-union';

// Esporta le type guard
export {
  isMessage,
  isExtensionMessage,
  isWebviewMessage,
  isMessageOfType,
  hasPayload,
  hasError,
  guards
} from './guards';

// Re-export dei tipi necessari da webview.types
export type {
  ChatMessage,
  ContextPrompt,
  ExtensionState,
  SerializedSettings,
  SettingValue
} from '../types/webview.types';
// Manteniamo temporaneamente le esportazioni legacy per retrocompatibilità
// ma segnaliamo che sono deprecate
// TODO: Rimuovere queste esportazioni quando tutti i file saranno migrati

/** @deprecated Usare ExtensionPromptMessage da extension-message */
export { type ExtensionPromptMessage as LegacyExtensionPromptMessage } from '../types/prompt-message';
/** @deprecated Usare isExtensionPromptMessage da extension-message */
export { isExtensionPromptMessage as isLegacyExtensionPromptMessage } from '../types/prompt-message';

// WebView message types (da migrare a BaseMessage nel futuro)
/** @deprecated Da migrare a BaseMessage */
export {
  type WebviewMessageUnion as LegacyWebviewMessageUnion,
  isSendPromptMessage,
  isActionMessage as isLegacyActionMessage,
  isErrorMessage as isLegacyErrorMessage,
  isResponseMessage as isLegacyResponseMessage,
  isStateMessage as isLegacyStateMessage,
  isInstructionMessage
} from '../types/webviewMessageUnion';

// Additional interfaces needed by WebSocketBridge and WebviewDispatcher
export { type SupportedMessageUnion } from '../types/message-adapter';

// ***********************************************
// DEPRECATED: For compatibility during migration
// ***********************************************
// These will be removed in a future update - please use the new exports above
export { WebSocketMessageType } from '../types/websocketMessageUnion';

// NOTE: WebSocket and WebView message types will be migrated to a base message in the future

// @file: src/shared/messages/index.ts
// @description: Importazioni centralizzate per tutti i tipi di messaggi del sistema
// @version: 2.0.0

// Importazioni dei tipi base
import { type BaseMessage } from '../types/base-message';
import { type WebSocketMessageUnion } from '../types/websocketMessageUnion';
import { type WebviewMessageUnion } from '../types/webview-message';
import { type AgentMessageUnion } from '../types/mas-message';
import { type ExtensionPromptMessage } from '../types/prompt-message';
import { 
  type WebviewMessageUnknown,
  isWebviewMessageUnknown
} from '../types/guards';

// Importazione dell'adapter centralizzato
import { 
  type SupportedMessageUnion,
  isMessageOfType,
  getMessageType
} from '../types/message-adapter';

// Importazione delle guardie per i messaggi WebSocket
import {
  isWebSocketMessage,
  isPingMessage,
  isPongMessage,
  isDisconnectMessage,
  isConnectMessage,
  isWebSocketErrorMessage,
  isLlmStatusMessage,
  isLlmCancelMessage,
  isMasMessage,
  isAgentTypingMessage,
  isAgentTypingDoneMessage,
  isAgentStatusUpdateMessage
} from '../types/websocket-guards';

// Importazione delle guardie per i messaggi di estensione
import {
  isExtensionMessage,
  isExtensionPromptMessage,
  isExtensionConfigMessage,
  isModelConfigMessage
} from '../types/extension-guards';

// Importazione delle guardie per i messaggi della webview
import {
  isWebviewMessage,
  isWebviewChatMessage,
  isWebviewConfigMessage
} from '../types/webview-guards';

// Importazione delle guardie per i messaggi degli agenti
import {
  isAgentMessage,
  isAgentStatusMessage
} from '../types/mas-guards';

// Importazione degli Enum
import { 
  ExtensionMessageType 
} from '../types/extension-message';

// *** EXPORT SECTION ***

// 1. Export dei tipi di messaggi base
export type { BaseMessage };
export { ExtensionMessageType };

// 2. Export dei tipi di messaggi specifici
export type { 
  WebSocketMessageUnion,
  WebviewMessageUnion,
  AgentMessageUnion,
  ExtensionPromptMessage
};

// 3. Export delle guardie di tipo
export {
  // Guardie WebSocket
  isWebSocketMessage,
  isPingMessage,
  isPongMessage,
  isConnectMessage,
  isDisconnectMessage,
  isWebSocketErrorMessage,
  isLlmStatusMessage,
  isLlmCancelMessage,
  isMasMessage,
  isAgentTypingMessage,
  isAgentTypingDoneMessage,
  isAgentStatusUpdateMessage,

  // Guardie Extension
  isExtensionMessage,
  isExtensionPromptMessage,
  isExtensionConfigMessage,
  isModelConfigMessage,

  // Guardie Webview
  isWebviewMessage,
  isWebviewChatMessage,
  isWebviewConfigMessage,

  // Guardie Agenti
  isAgentMessage,
  isAgentStatusMessage,

  // Guardie generiche e utilities
  isWebviewMessageUnknown
};

// 4. Export tipi e funzioni di supporto per il bridge
export type { 
  WebviewMessageUnknown,
  SupportedMessageUnion
};

export {
  isMessageOfType,
  getMessageType
};

// NOTA: Tipi export deprecati, da rimuovere nelle versioni future 
// e da sostituire con quelli nuovi
// @deprecated - Usa i tipi e le guardie centralizzati
export * from '../types/message.types';

// NOTA: WebSocket e WebView message types verranno migrati a un base message nel futuro

// Export delle guardie dei messaggi
export * from './guards/isExtensionMessage';
export * from './guards/isWebviewMessage';
export * from './guards/isPromptMessage';
export * from './guards/isApiMessage';
export * from './guards/isErrorMessage';
export * from './guards/isNavigationMessage';
export * from './guards/isStateMessage';

// Export dei tipi
export * from './types';

// Export delle costanti
export * from './constants';

// Export all message types
export * from './types/apiMessages';

// Export all message guards
export * from './guards/isApiMessageSpecific';

export * from '../schemas/extensionMessages';
