/**
 * @file handlers.ts
 * @description Handler dei messaggi per il modulo router
 */

import { webviewBridge } from '@utils/WebviewBridge';
import type { RouterMessage } from './types';
import { RouterMessageType } from './types';

/**
 * Handler per il messaggio di navigazione
 */
export function handleNavigate(message: RouterMessage) {
  if (message.type !== RouterMessageType.NAVIGATE) return;
  
  const { route, params } = (msg.payload as unknown);
  // Invia il messaggio all'estensione
  webviewBridge.sendMessage({
    type: 'navigate',
    payload: { route, params }
  });
}

/**
 * Handler per il messaggio di apertura rotta
 */
export function handleOpenRoute(message: RouterMessage) {
  if (message.type !== RouterMessageType.OPEN_ROUTE) return;

  const { route, params } = (msg.payload as unknown);
  // Invia il messaggio all'estensione
  webviewBridge.sendMessage({
    type: 'openRoute',
    payload: { route, params }
  });
}

/**
 * Handler per il toggle della sidebar
 */
export function handleToggleSidebar(message: RouterMessage) {
  if (message.type !== RouterMessageType.TOGGLE_SIDEBAR) return;

  const { visible } = (msg.payload as unknown);
  // Invia il messaggio all'estensione
  webviewBridge.sendMessage({
    type: 'toggleSidebar',
    payload: { visible }
  });
}

/**
 * Handler per il toggle del terminale
 */
export function handleToggleTerminal(message: RouterMessage) {
  if (message.type !== RouterMessageType.TOGGLE_TERMINAL) return;

  const { visible } = (msg.payload as unknown);
  // Invia il messaggio all'estensione
  webviewBridge.sendMessage({
    type: 'toggleTerminal',
    payload: { visible }
  });
}

/**
 * Handler per l'impostazione del tema
 */
export function handleSetTheme(message: RouterMessage) {
  if (message.type !== RouterMessageType.SET_THEME) return;

  const { theme } = (msg.payload as unknown);
  // Invia il messaggio all'estensione
  webviewBridge.sendMessage({
    type: 'setTheme',
    payload: { theme }
  });
}

/**
 * Handler per l'impostazione della dimensione del font
 */
export function handleSetFontSize(message: RouterMessage) {
  if (message.type !== RouterMessageType.SET_FONT_SIZE) return;

  const { size } = (msg.payload as unknown);
  // Invia il messaggio all'estensione
  webviewBridge.sendMessage({
    type: 'setFontSize',
    payload: { size }
  });
}

/**
 * Mappa degli handler per tipo di messaggio
 */
export const messageHandlers = {
  [RouterMessageType.NAVIGATE]: handleNavigate,
  [RouterMessageType.OPEN_ROUTE]: handleOpenRoute,
  [RouterMessageType.TOGGLE_SIDEBAR]: handleToggleSidebar,
  [RouterMessageType.TOGGLE_TERMINAL]: handleToggleTerminal,
  [RouterMessageType.SET_THEME]: handleSetTheme,
  [RouterMessageType.SET_FONT_SIZE]: handleSetFontSize
}; 