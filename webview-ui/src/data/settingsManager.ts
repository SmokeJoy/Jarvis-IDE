/**
 * @file settingsManager.ts
 * @description Gestore delle impostazioni dell'applicazione
 * @version 1.0.0
 */

import { ExtensionPromptMessage } from '@shared/messages';
import { webviewBridge } from '../utils/WebSocketBridge';

/**
 * Logger dedicato per il settings manager
 */
const logger = {
  debug: (message: string, ...data: any[]) => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[SettingsManager] ${message}`, ...data);
    }
  },
  info: (message: string, ...data: any[]) => console.info(`[SettingsManager] ${message}`, ...data),
  warn: (message: string, ...data: any[]) => console.warn(`[SettingsManager] ${message}`, ...data),
  error: (message: string, ...data: any[]) => console.error(`[SettingsManager] ${message}`, ...data)
};

/**
 * Tipo di base per le impostazioni
 */
export interface Settings {
  theme?: 'light' | 'dark' | 'system';
  use_docs?: boolean;
  coder_mode?: boolean;
  contextPrompt?: string;
  modelId?: string;
  [key: string]: string | number | boolean | undefined;
}

// Stato delle impostazioni correnti
let currentSettings: Settings = {};

/**
 * Inizializza il gestore delle impostazioni
 */
export function initializeSettings(): void {
  logger.debug('Inizializzazione settingsManager');
  
  // Carica le impostazioni dal localStorage
  try {
    const savedSettings = localStorage.getItem('jarvis.settings');
    if (savedSettings) {
      currentSettings = JSON.parse(savedSettings);
      logger.debug('Impostazioni caricate dal localStorage:', currentSettings);
    }
  } catch (error) {
    logger.error('Errore caricamento impostazioni dal localStorage:', error);
  }
}

/**
 * Gestore degli aggiornamenti delle impostazioni dall'estensione
 * @param message Messaggio di aggiornamento impostazioni
 */
export function handleSettingsUpdate(message: ExtensionPromptMessage): void {
  if (message.type !== 'settingsUpdated' || !(msg.payload as unknown)) {
    return;
  }
  
  logger.debug('Ricevuto aggiornamento impostazioni:', (msg.payload as unknown));
  
  // Aggiorna le impostazioni correnti
  const updatedSettings = (msg.payload as unknown).settings as Settings;
  currentSettings = { ...currentSettings, ...updatedSettings };
  
  // Salva le impostazioni nel localStorage
  try {
    localStorage.setItem('jarvis.settings', JSON.stringify(currentSettings));
  } catch (error) {
    logger.error('Errore salvataggio impostazioni nel localStorage:', error);
  }
  
  // Emetti un evento per notificare i componenti UI
  const event = new CustomEvent('SETTINGS_UPDATED', {
    detail: {
      settings: currentSettings
    }
  });
  window.dispatchEvent(event);
}

/**
 * Ottiene il valore di un'impostazione specifica
 * @param key Chiave dell'impostazione
 * @param defaultValue Valore di default se l'impostazione non esiste
 */
export function getSetting<T>(key: string, defaultValue?: T): T | undefined {
  return (currentSettings[key] as T) ?? defaultValue;
}

/**
 * Imposta il valore di un'impostazione specifica
 * @param key Chiave dell'impostazione
 * @param value Nuovo valore dell'impostazione
 */
export function setSetting(key: string, value: string | number | boolean): void {
  currentSettings[key] = value;
  
  // Salva le impostazioni nel localStorage
  try {
    localStorage.setItem('jarvis.settings', JSON.stringify(currentSettings));
  } catch (error) {
    logger.error('Errore salvataggio impostazioni nel localStorage:', error);
  }
  
  // Notifica l'estensione del cambiamento
  webviewBridge.postMessage({
    type: 'updateSetting',
    payload: {
      key,
      value
    }
  });
  
  // Emetti un evento per notificare i componenti UI
  const event = new CustomEvent('SETTING_UPDATED', {
    detail: {
      key,
      value
    }
  });
  window.dispatchEvent(event);
}

// Inizializza il gestore delle impostazioni all'avvio
initializeSettings(); 