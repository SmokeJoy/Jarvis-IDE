/**
 * @file settings-message-guards.ts
 * @description Type guards per la verifica dei tipi di messaggi delle impostazioni
 * @version 1.0.0
 */

import { WebviewMessage } from '../../../src/shared/types/webview.types';
import {
  SettingsMessageType,
  SettingsMessageUnion,
  GetSettingsMessage,
  SettingsLoadedMessage,
  UpdateSettingMessage,
  SettingUpdatedMessage,
  SaveAllSettingsMessage,
  ResetAllSettingsMessage,
  SettingsErrorMessage
} from './settings-message';

/**
 * Type guard generico per verificare se un messaggio è di un tipo specifico Settings
 * @param message Il messaggio da verificare
 * @param type Il tipo di messaggio atteso
 * @returns True se il messaggio è del tipo specificato
 */
export function isMessageOfType<T extends SettingsMessageUnion>(
  message: WebviewMessage<any>, 
  type: SettingsMessageType
): message is T {
  return message?.type === type;
}

/**
 * Type guard per verificare se un messaggio è un messaggio di impostazioni generico
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un messaggio di impostazioni
 */
export function isSettingsMessage(message: WebviewMessage<any>): message is SettingsMessageUnion {
  return (
    message &&
    typeof message === 'object' &&
    'type' in message &&
    Object.values(SettingsMessageType).includes(message.type as SettingsMessageType)
  );
}

/**
 * Type guard per verificare se un messaggio è un GetSettingsMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un GetSettingsMessage
 */
export function isGetSettingsMessage(message: WebviewMessage<any>): message is GetSettingsMessage {
  return isMessageOfType<GetSettingsMessage>(message, SettingsMessageType.GET_SETTINGS);
}

/**
 * Type guard per verificare se un messaggio è un SettingsLoadedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SettingsLoadedMessage
 */
export function isSettingsLoadedMessage(message: WebviewMessage<any>): message is SettingsLoadedMessage {
  return isMessageOfType<SettingsLoadedMessage>(message, SettingsMessageType.SETTINGS_LOADED) && 
         'settings' in message &&
         typeof message.settings === 'object';
}

/**
 * Type guard per verificare se un messaggio è un UpdateSettingMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un UpdateSettingMessage
 */
export function isUpdateSettingMessage(message: WebviewMessage<any>): message is UpdateSettingMessage {
  return isMessageOfType<UpdateSettingMessage>(message, SettingsMessageType.UPDATE_SETTING) &&
         'key' in message &&
         typeof message.key === 'string';
}

/**
 * Type guard per verificare se un messaggio è un SettingUpdatedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SettingUpdatedMessage
 */
export function isSettingUpdatedMessage(message: WebviewMessage<any>): message is SettingUpdatedMessage {
  return isMessageOfType<SettingUpdatedMessage>(message, SettingsMessageType.SETTING_UPDATED) &&
         'key' in message &&
         typeof message.key === 'string';
}

/**
 * Type guard per verificare se un messaggio è un SaveAllSettingsMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SaveAllSettingsMessage
 */
export function isSaveAllSettingsMessage(message: WebviewMessage<any>): message is SaveAllSettingsMessage {
  return isMessageOfType<SaveAllSettingsMessage>(message, SettingsMessageType.SAVE_ALL_SETTINGS) &&
         'settings' in message &&
         typeof message.settings === 'object';
}

/**
 * Type guard per verificare se un messaggio è un ResetAllSettingsMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ResetAllSettingsMessage
 */
export function isResetAllSettingsMessage(message: WebviewMessage<any>): message is ResetAllSettingsMessage {
  return isMessageOfType<ResetAllSettingsMessage>(message, SettingsMessageType.RESET_ALL_SETTINGS);
}

/**
 * Type guard per verificare se un messaggio è un SettingsErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un SettingsErrorMessage
 */
export function isSettingsErrorMessage(message: WebviewMessage<any>): message is SettingsErrorMessage {
  return isMessageOfType<SettingsErrorMessage>(message, SettingsMessageType.ERROR) &&
         'message' in message &&
         typeof message.message === 'string';
} 