/**
 * @file types.ts
 * @description Tipi per il modulo router
 */

import type { WebviewMessage } from '@shared/messages';

/**
 * Tipi di messaggi gestiti dal router
 */
export enum RouterMessageType {
  NAVIGATE = 'navigate',
  TOGGLE_SIDEBAR = 'toggleSidebar',
  OPEN_ROUTE = 'openRoute',
  TOGGLE_TERMINAL = 'toggleTerminal',
  SET_THEME = 'setTheme',
  SET_FONT_SIZE = 'setFontSize'
}

/**
 * Messaggio di navigazione
 */
export interface NavigateMessage extends WebviewMessage {
  type: RouterMessageType.NAVIGATE;
  payload: {
    route: string;
    params?: Record<string, string>;
  };
}

/**
 * Messaggio per aprire una rotta
 */
export interface OpenRouteMessage extends WebviewMessage {
  type: RouterMessageType.OPEN_ROUTE;
  payload: {
    route: string;
    params?: Record<string, string>;
  };
}

/**
 * Messaggio per il toggle della sidebar
 */
export interface ToggleSidebarMessage extends WebviewMessage {
  type: RouterMessageType.TOGGLE_SIDEBAR;
  payload: {
    visible?: boolean;
  };
}

/**
 * Messaggio per il toggle del terminale
 */
export interface ToggleTerminalMessage extends WebviewMessage {
  type: RouterMessageType.TOGGLE_TERMINAL;
  payload: {
    visible?: boolean;
  };
}

/**
 * Messaggio per impostare il tema
 */
export interface SetThemeMessage extends WebviewMessage {
  type: RouterMessageType.SET_THEME;
  payload: {
    theme: 'light' | 'dark' | 'system';
  };
}

/**
 * Messaggio per impostare la dimensione del font
 */
export interface SetFontSizeMessage extends WebviewMessage {
  type: RouterMessageType.SET_FONT_SIZE;
  payload: {
    size: number;
  };
}

/**
 * Unione dei tipi di messaggi del router
 */
export type RouterMessage =
  | NavigateMessage
  | OpenRouteMessage
  | ToggleSidebarMessage
  | ToggleTerminalMessage
  | SetThemeMessage
  | SetFontSizeMessage; 