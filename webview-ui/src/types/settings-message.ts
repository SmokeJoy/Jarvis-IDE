/**
 * @file settings-message.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi Settings
 * @version 1.0.0
 */

import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';

/**
 * Enum per i tipi di messaggi delle impostazioni
 */
export enum SettingsMessageType {
  // Richieste al backend
  GET_SETTINGS = 'getSettings',
  UPDATE_SETTING = 'updateSetting',
  SAVE_ALL_SETTINGS = 'saveAllSettings',
  RESET_ALL_SETTINGS = 'resetAllSettings',
  
  // Risposte dal backend
  SETTINGS_LOADED = 'settingsLoaded',
  SETTING_UPDATED = 'settingUpdated',
  ERROR = 'error'
}

/**
 * Interfaccia per le impostazioni dell'IDE
 */
export interface IDESettings {
  use_docs?: boolean;
  coder_mode?: boolean;
  contextPrompt?: string;
  selectedModel?: string;
  availableModels?: string[];
  [key: string]: any; // Per altre impostazioni non tipizzate esplicitamente
}

/**
 * Interfaccia base per tutti i messaggi di impostazioni
 */
export interface SettingsMessageBase extends WebviewMessageUnion {
  type: SettingsMessageType | string;
}

/**
 * Messaggio per richiedere le impostazioni attuali
 */
export interface GetSettingsMessage extends SettingsMessageBase {
  type: SettingsMessageType.GET_SETTINGS;
}

/**
 * Messaggio con le impostazioni caricate
 */
export interface SettingsLoadedMessage extends SettingsMessageBase {
  type: SettingsMessageType.SETTINGS_LOADED;
  settings: IDESettings;
}

/**
 * Messaggio per aggiornare una singola impostazione
 */
export interface UpdateSettingMessage extends SettingsMessageBase {
  type: SettingsMessageType.UPDATE_SETTING;
  key: string;
  value: any;
}

/**
 * Messaggio di conferma per impostazione aggiornata
 */
export interface SettingUpdatedMessage extends SettingsMessageBase {
  type: SettingsMessageType.SETTING_UPDATED;
  key: string;
  value: any;
}

/**
 * Messaggio per salvare tutte le impostazioni
 */
export interface SaveAllSettingsMessage extends SettingsMessageBase {
  type: SettingsMessageType.SAVE_ALL_SETTINGS;
  settings: IDESettings;
}

/**
 * Messaggio per ripristinare le impostazioni predefinite
 */
export interface ResetAllSettingsMessage extends SettingsMessageBase {
  type: SettingsMessageType.RESET_ALL_SETTINGS;
}

/**
 * Messaggio di errore per le impostazioni
 */
export interface SettingsErrorMessage extends SettingsMessageBase {
  type: SettingsMessageType.ERROR;
  message: string;
}

/**
 * Union discriminata di tutti i tipi di messaggi delle impostazioni
 */
export type SettingsMessageUnion =
  | GetSettingsMessage
  | SettingsLoadedMessage
  | UpdateSettingMessage
  | SettingUpdatedMessage
  | SaveAllSettingsMessage
  | ResetAllSettingsMessage
  | SettingsErrorMessage; 