/**
 * @file browser-settings-message.ts
 * @description Definizione centralizzata delle unioni discriminate per i tipi di messaggi di impostazioni browser
 * @version 1.0.0
 */

import type { WebviewMessageUnion } from '../../../src/shared/types/webviewMessageUnion';
import type { BrowserSettings } from '../../../src/shared/types/user-settings.types';

/**
 * Enum per i tipi di messaggi delle impostazioni browser
 */
export enum BrowserSettingsMessageType {
  // Richieste al backend
  UPDATE_BROWSER_SETTINGS = 'browserSettings',
  TOGGLE_HEADLESS_MODE = 'toggleHeadlessMode',
  UPDATE_VIEWPORT = 'updateViewport',
  
  // Comandi speciali
  RELAUNCH_CHROME_DEBUG_MODE = 'relaunchChromeDebugMode',
  
  // Risposte dal backend
  BROWSER_SETTINGS_UPDATED = 'browserSettingsUpdated',
  BROWSER_ERROR = 'browserError'
}

/**
 * Interfaccia base per tutti i messaggi di impostazioni browser
 */
export interface BrowserSettingsMessageBase extends WebviewMessageUnion {
  type: BrowserSettingsMessageType | string;
}

/**
 * Messaggio per aggiornare le impostazioni complessive del browser
 */
export interface UpdateBrowserSettingsMessage extends BrowserSettingsMessageBase {
  type: BrowserSettingsMessageType.UPDATE_BROWSER_SETTINGS;
  browserSettings: Partial<BrowserSettings>;
}

/**
 * Messaggio per attivare/disattivare la modalità headless
 */
export interface ToggleHeadlessModeMessage extends BrowserSettingsMessageBase {
  type: BrowserSettingsMessageType.TOGGLE_HEADLESS_MODE;
  headless: boolean;
}

/**
 * Messaggio per aggiornare le dimensioni del viewport
 */
export interface UpdateViewportMessage extends BrowserSettingsMessageBase {
  type: BrowserSettingsMessageType.UPDATE_VIEWPORT;
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * Messaggio per riavviare Chrome in modalità debug
 */
export interface RelaunchChromeDebugModeMessage extends BrowserSettingsMessageBase {
  type: BrowserSettingsMessageType.RELAUNCH_CHROME_DEBUG_MODE;
}

/**
 * Messaggio di risposta quando le impostazioni del browser sono state aggiornate
 */
export interface BrowserSettingsUpdatedMessage extends BrowserSettingsMessageBase {
  type: BrowserSettingsMessageType.BROWSER_SETTINGS_UPDATED;
  browserSettings: BrowserSettings;
}

/**
 * Messaggio di risposta in caso di errore
 */
export interface BrowserErrorMessage extends BrowserSettingsMessageBase {
  type: BrowserSettingsMessageType.BROWSER_ERROR;
  error: string;
}

/**
 * Unione discriminata di tutti i tipi di messaggi di impostazioni browser
 */
export type BrowserSettingsMessageUnion =
  | UpdateBrowserSettingsMessage
  | ToggleHeadlessModeMessage
  | UpdateViewportMessage
  | RelaunchChromeDebugModeMessage
  | BrowserSettingsUpdatedMessage
  | BrowserErrorMessage; 