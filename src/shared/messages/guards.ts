import { z } from 'zod';
/**
 * @file guards.ts
 * @description Type guards per i messaggi tra extension e webview
 * @author dev ai 1
 */

import type { Message, ExtensionMessage, WebviewMessage } from './messages-union';

// Guard base per verificare se un oggetto è un messaggio valido
export function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as Message).type === 'string'
  );
}

// Guard per i messaggi dell'estensione
export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!isMessage(value)) return false;
  
  // Lista dei tipi di messaggi dell'estensione
  const extensionTypes = [
    'error',
    'response',
    'state',
    'action',
    'promptProfiles',
    'promptProfileUpdated',
    'promptProfileCreated',
    'promptProfileDeleted',
    'settingsUpdated',
    'settingsReset',
    'chatMessage',
    'chatHistory',
    'chatCleared',
    'agentStatus',
    'agentResult',
    'customInstructions',
    'ready'
  ] as const;
  
  return extensionTypes.includes(value.type as any);
}

// Guard per i messaggi della webview
export function isWebviewMessage(value: unknown): value is WebviewMessage {
  if (!isMessage(value)) return false;
  
  // Lista dei tipi di messaggi della webview
  const webviewTypes = [
    'ready',
    'request',
    'fetchSettings',
    'updateSetting',
    'resetSettings',
    'sendChatMessage',
    'fetchChatHistory',
    'clearChat',
    'stopGeneration',
    'selectModel',
    'fetchModels',
    'updateContextPrompt',
    'fetchContextPrompt',
    'createPromptProfile',
    'updatePromptProfile',
    'deletePromptProfile',
    'fetchPromptProfiles',
    'agentCommand',
    'updateCustomInstructions',
    'fetchCustomInstructions'
  ] as const;
  
  return webviewTypes.includes(value.type as any);
}

// Guard per tipi specifici di messaggi
export function isMessageOfType<T extends Message['type']>(
  value: unknown,
  type: T
): value is Extract<Message, { type: T }> {
  return isMessage(value) && value.type === type;
}

// Guard per verificare se un messaggio ha un payload
export function hasPayload<T extends Message>(
  message: T
): message is T & { payload: unknown } {
  return 'payload' in message;
}

// Guard per verificare se un messaggio ha un errore
export function hasError<T extends Message>(
  message: T
): message is T & { error: string } {
  return 'error' in message && typeof message.error === 'string';
}

// Guard specifiche per ogni tipo di messaggio
export const guards = {
  // Extension messages
  isErrorMessage: (value: unknown): value is Extract<ExtensionMessage, { type: 'error' }> =>
    isMessageOfType(value, 'error'),
    
  isResponseMessage: (value: unknown): value is Extract<ExtensionMessage, { type: 'response' }> =>
    isMessageOfType(value, 'response'),
    
  isStateMessage: (value: unknown): value is Extract<ExtensionMessage, { type: 'state' }> =>
    isMessageOfType(value, 'state'),
    
  isActionMessage: (value: unknown): value is Extract<ExtensionMessage, { type: 'action' }> =>
    isMessageOfType(value, 'action'),
    
  isPromptProfilesMessage: (value: unknown): value is Extract<ExtensionMessage, { type: 'promptProfiles' }> =>
    isMessageOfType(value, 'promptProfiles'),
    
  // Webview messages
  isReadyMessage: (value: unknown): value is Extract<WebviewMessage, { type: 'ready' }> =>
    isMessageOfType(value, 'ready'),
    
  isRequestMessage: (value: unknown): value is Extract<WebviewMessage, { type: 'request' }> =>
    isMessageOfType(value, 'request'),
    
  isFetchSettingsMessage: (value: unknown): value is Extract<WebviewMessage, { type: 'fetchSettings' }> =>
    isMessageOfType(value, 'fetchSettings'),
    
  isUpdateSettingMessage: (value: unknown): value is Extract<WebviewMessage, { type: 'updateSetting' }> =>
    isMessageOfType(value, 'updateSetting'),
    
  // ... altre guard specifiche possono essere aggiunte qui
}; 
 