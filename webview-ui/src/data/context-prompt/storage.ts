/**
 * @file storage.ts
 * @description Gestione della persistenza per il modulo context-prompt
 * @author dev ai 1
 */

import type { ContextPrompt, PromptProfile } from './types';
import { STORAGE_KEYS } from './types';
import { DEFAULT_PROFILE } from './constants';
import logger from '@shared/utils/outputLogger';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('ContextPromptStorage');

/**
 * Salva i prompt nel localStorage
 */
export function savePromptsToStorage(prompts: ContextPrompt): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTEXT_PROMPT, JSON.stringify(prompts));
    componentLogger.debug('Prompt salvati nel localStorage');
  } catch (error) {
    componentLogger.error('Errore nel salvataggio dei prompt:', { error });
  }
}

/**
 * Salva i profili nel localStorage
 */
export function saveProfilesToStorage(profiles: PromptProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROMPT_PROFILES, JSON.stringify(profiles));
    componentLogger.debug('Profili salvati nel localStorage', { count: profiles.length });
  } catch (error) {
    componentLogger.error('Errore nel salvataggio dei profili:', { error });
  }
}

/**
 * Salva l'ID del profilo attivo nel localStorage
 */
export function saveActiveProfileId(profileId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, profileId);
    componentLogger.debug('ID profilo attivo salvato', { profileId });
  } catch (error) {
    componentLogger.error('Errore nel salvataggio dell\'ID profilo attivo:', { error });
  }
}

/**
 * Carica i prompt dal localStorage
 */
export function loadPromptsFromStorage(): ContextPrompt | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONTEXT_PROMPT);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as ContextPrompt;
    componentLogger.debug('Prompt caricati dal localStorage');
    return parsed;
  } catch (error) {
    componentLogger.error('Errore nel caricamento dei prompt:', { error });
    return null;
  }
}

/**
 * Carica i profili dal localStorage
 */
export function loadProfilesFromStorage(): PromptProfile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROMPT_PROFILES);
    if (!stored) return [DEFAULT_PROFILE];

    const parsed = JSON.parse(stored) as PromptProfile[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [DEFAULT_PROFILE];
    }

    componentLogger.debug('Profili caricati dal localStorage', { count: parsed.length });
    return parsed;
  } catch (error) {
    componentLogger.error('Errore nel caricamento dei profili:', { error });
    return [DEFAULT_PROFILE];
  }
}

/**
 * Carica l'ID del profilo attivo dal localStorage
 */
export function loadActiveProfileId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
  } catch (error) {
    componentLogger.error('Errore nel caricamento dell\'ID profilo attivo:', { error });
    return null;
  }
}

/**
 * Rimuove tutti i dati dal localStorage
 */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONTEXT_PROMPT);
    localStorage.removeItem(STORAGE_KEYS.PROMPT_PROFILES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    componentLogger.info('Storage pulito');
  } catch (error) {
    componentLogger.error('Errore nella pulizia dello storage:', { error });
  }
} 
 