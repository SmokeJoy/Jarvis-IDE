/**
 * @file handlers.ts
 * @description Handler per i messaggi del modulo context-prompt
 * @author dev ai 1
 */

import { webviewBridge } from '@webview/utils/WebviewBridge';
import { 
  isExtensionPromptMessage,
  isPromptProfilesMessage,
  isPromptProfileUpdatedMessage,
  ExtensionMessageType,
  WebviewMessageType
} from '@shared/messages';
import type { PromptProfile, ContextPrompt } from './types';
import { promptStateManager } from './state';
import { 
  savePromptsToStorage,
  saveProfilesToStorage,
  saveActiveProfileId
} from './storage';
import { DEFAULT_PROFILE } from './constants';
import logger from '@shared/utils/outputLogger';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('ContextPromptHandlers');

/**
 * Inizializza gli handler dei messaggi
 */
export function initializeMessageHandlers(): void {
  // Handler per i profili di prompt
  webviewBridge.on('promptProfiles', handlePromptProfilesMessage);
  
  // Handler per l'aggiornamento del profilo
  webviewBridge.on('promptProfileUpdated', handlePromptProfileUpdatedMessage);
}

/**
 * Gestisce il messaggio con i profili di prompt
 */
function handlePromptProfilesMessage(message: unknown): void {
  // Narrowing iniziale con type guard
  if (!isExtensionPromptMessage(message)) {
    componentLogger.warn('Messaggio ricevuto non valido:', { message });
    return;
  }

  // Narrowing del tipo specifico
  if (!isPromptProfilesMessage(message)) {
    componentLogger.warn('Tipo messaggio non gestito:', { type: message.type });
    return;
  }

  const { profiles } = (msg.payload as unknown);
  
  // Aggiorna lo stato
  promptStateManager.setProfilesCache(profiles);
  
  // Se non c'è un profilo attivo, usa il default o il primo disponibile
  if (!promptStateManager.getActiveProfileId()) {
    const defaultProfile = profiles.find(p => p.isDefault) || profiles[0] || DEFAULT_PROFILE;
    promptStateManager.setActiveProfileId(defaultProfile.id);
    promptStateManager.setPromptCache(defaultProfile.contextPrompt);
  }

  // Salva in localStorage
  saveProfilesToStorage(profiles);
}

/**
 * Gestisce il messaggio di aggiornamento del profilo
 */
function handlePromptProfileUpdatedMessage(message: unknown): void {
  // Narrowing iniziale con type guard
  if (!isExtensionPromptMessage(message)) {
    componentLogger.warn('Messaggio ricevuto non valido:', { message });
    return;
  }

  // Narrowing del tipo specifico
  if (!isPromptProfileUpdatedMessage(message)) {
    componentLogger.warn('Tipo messaggio non gestito:', { type: message.type });
    return;
  }

  const { profile } = (msg.payload as unknown);
  
  // Aggiorna la cache dei profili
  const currentProfiles = promptStateManager.getProfilesCache() || [];
  const updatedProfiles = currentProfiles.map(p => 
    p.id === profile.id ? profile : p
  );
  
  promptStateManager.setProfilesCache(updatedProfiles);
  
  // Se è il profilo attivo, aggiorna anche i prompt
  if (profile.id === promptStateManager.getActiveProfileId()) {
    promptStateManager.setPromptCache(profile.contextPrompt);
    savePromptsToStorage(profile.contextPrompt);
  }
  
  // Salva in localStorage
  saveProfilesToStorage(updatedProfiles);
}

/**
 * Invia un messaggio di aggiornamento del profilo all'estensione
 */
export function sendProfileUpdateMessage(profile: PromptProfile): void {
  webviewBridge.sendMessage({
    type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
    payload: { profile }
  });
  componentLogger.debug('Inviato aggiornamento profilo', { profileId: profile.id });
}

/**
 * Invia una richiesta di profili all'estensione
 */
export function requestProfiles(): void {
  webviewBridge.sendMessage({
    type: WebviewMessageType.GET_PROMPT_PROFILES
  });
  componentLogger.debug('Richiesti profili di prompt');
}

/**
 * Invia un messaggio di aggiornamento del prompt all'estensione
 */
export function sendPromptUpdateMessage(contextPrompt: ContextPrompt): void {
  webviewBridge.sendMessage({
    type: WebviewMessageType.UPDATE_CONTEXT_PROMPT,
    payload: { contextPrompt }
  });
  componentLogger.debug('Inviato aggiornamento prompt');
} 
 