/**
 * @file browser-settings-message-guards.ts
 * @description Type guards per verificare i tipi di messaggi delle impostazioni browser
 * @version 1.0.0
 */

import type { WebviewMessage } from '../../../src/shared/types/webview.types';
import { 
  BrowserSettingsMessageType,
  BrowserSettingsMessageUnion,
  UpdateBrowserSettingsMessage,
  ToggleHeadlessModeMessage,
  UpdateViewportMessage,
  RelaunchChromeDebugModeMessage,
  BrowserSettingsUpdatedMessage,
  BrowserErrorMessage
} from './browser-settings-message';

/**
 * Type guard generico per verificare se un messaggio è un messaggio di impostazioni browser
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un BrowserSettingsMessageUnion
 */
export function isBrowserSettingsMessage(message: WebviewMessage<any>): message is BrowserSettingsMessageUnion {
  return Object.values(BrowserSettingsMessageType).includes(message?.type as BrowserSettingsMessageType);
}

/**
 * Type guard per verificare se un messaggio è un UpdateBrowserSettingsMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un UpdateBrowserSettingsMessage
 */
export function isUpdateBrowserSettingsMessage(message: WebviewMessage<any>): message is UpdateBrowserSettingsMessage {
  return message?.type === BrowserSettingsMessageType.UPDATE_BROWSER_SETTINGS && 
         'browserSettings' in message;
}

/**
 * Type guard per verificare se un messaggio è un ToggleHeadlessModeMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un ToggleHeadlessModeMessage
 */
export function isToggleHeadlessModeMessage(message: WebviewMessage<any>): message is ToggleHeadlessModeMessage {
  return message?.type === BrowserSettingsMessageType.TOGGLE_HEADLESS_MODE && 
         'headless' in message && 
         typeof message.headless === 'boolean';
}

/**
 * Type guard per verificare se un messaggio è un UpdateViewportMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un UpdateViewportMessage
 */
export function isUpdateViewportMessage(message: WebviewMessage<any>): message is UpdateViewportMessage {
  return message?.type === BrowserSettingsMessageType.UPDATE_VIEWPORT && 
         'viewport' in message && 
         typeof message.viewport === 'object' &&
         'width' in message.viewport &&
         'height' in message.viewport;
}

/**
 * Type guard per verificare se un messaggio è un RelaunchChromeDebugModeMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un RelaunchChromeDebugModeMessage
 */
export function isRelaunchChromeDebugModeMessage(message: WebviewMessage<any>): message is RelaunchChromeDebugModeMessage {
  return message?.type === BrowserSettingsMessageType.RELAUNCH_CHROME_DEBUG_MODE;
}

/**
 * Type guard per verificare se un messaggio è un BrowserSettingsUpdatedMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un BrowserSettingsUpdatedMessage
 */
export function isBrowserSettingsUpdatedMessage(message: WebviewMessage<any>): message is BrowserSettingsUpdatedMessage {
  return message?.type === BrowserSettingsMessageType.BROWSER_SETTINGS_UPDATED && 
         'browserSettings' in message;
}

/**
 * Type guard per verificare se un messaggio è un BrowserErrorMessage
 * @param message Il messaggio da verificare
 * @returns True se il messaggio è un BrowserErrorMessage
 */
export function isBrowserErrorMessage(message: WebviewMessage<any>): message is BrowserErrorMessage {
  return message?.type === BrowserSettingsMessageType.BROWSER_ERROR && 
         'error' in message && 
         typeof message.error === 'string';
}

/**
 * Helper per verificare il tipo di messaggio usando il tipo discriminante
 * @param message Il messaggio da verificare
 * @param type Il tipo da verificare
 * @returns True se il messaggio è del tipo specificato
 */
export function isBrowserSettingsMessageOfType<T extends BrowserSettingsMessageType>(
  message: WebviewMessage<any>,
  type: T
): message is BrowserSettingsMessageUnion & { type: T } {
  return isBrowserSettingsMessage(message) && message.type === type;
} 