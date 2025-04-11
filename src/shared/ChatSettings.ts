/**
 * @file ChatSettings.ts
 * @description Tipi e funzioni per le impostazioni di chat
 */

import { ChatSettings } from './types/user-settings.types.js';

// Esporta i tipi usando export type per evitare errori TS1205
export type { ChatSettings };

/**
 * Normalizza le impostazioni di chat
 * @param settings Le impostazioni da normalizzare
 * @returns Le impostazioni di chat normalizzate
 */
export function normalizeChatSettings(settings?: Partial<ChatSettings>): ChatSettings {
  return {
    fontSize: settings?.fontSize ?? 14,
    enableSyntaxHighlighting: settings?.enableSyntaxHighlighting ?? true,
    saveHistory: settings?.saveHistory ?? true,
    maxHistoryItems: settings?.maxHistoryItems ?? 100,
    showAvatars: settings?.showAvatars ?? true,
    enableAutoScroll: settings?.enableAutoScroll ?? true,
    displayTimestamps: settings?.displayTimestamps ?? false,
    theme: settings?.theme ?? 'system',
    useMarkdown: settings?.useMarkdown ?? true
  };
}
