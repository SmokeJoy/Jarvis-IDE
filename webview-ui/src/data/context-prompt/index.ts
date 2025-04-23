/**
 * @file index.ts
 * @description API pubblica per il modulo context-prompt
 * @author dev ai 1
 */

import type { WebviewBridge } from '@shared/utils/WebviewBridge';
import type { ContextPrompt, PromptProfile } from '@shared/messages';
import type { PromptSlotType, PromptManagerState } from './types';
import { PromptStateManager } from './state';
import { 
  loadProfilesFromStorage,
  loadActiveProfileId,
  loadPromptsFromStorage,
  savePromptsToStorage,
  saveActiveProfileId
} from './storage';
import {
  registerMessageHandlers,
  requestProfiles,
  updateProfileOnExtension
} from './message-handlers';
import { DEFAULT_PROFILE, DEFAULT_PROMPTS } from './constants';
import logger from '@shared/utils/outputLogger';

const componentLogger = logger.createComponentLogger('ContextPromptManager');

/**
 * Crea e inizializza il context prompt manager
 */
export function createContextPromptManager(bridge: WebviewBridge) {
  const state = new PromptStateManager();

  try {
    // Carica i dati dal localStorage
    const storedProfiles = loadProfilesFromStorage();
    const storedActiveId = loadActiveProfileId();
    const storedPrompts = loadPromptsFromStorage();

    // Imposta lo stato iniziale
    if (storedProfiles && storedActiveId) {
      state.setProfiles(storedProfiles);
      state.setActiveProfile(storedActiveId);
    } else {
      state.setState({
        profilesCache: [DEFAULT_PROFILE],
        activeProfileId: DEFAULT_PROFILE.id,
        promptCache: storedPrompts || DEFAULT_PROMPTS
      });
    }

    // Registra gli handler dei messaggi
    registerMessageHandlers({ bridge, state });

    // Richiedi i profili all'estensione
    requestProfiles(bridge);

    componentLogger.debug('Context Prompt Manager inizializzato');

  } catch (error) {
    componentLogger.error('Errore durante l\'inizializzazione:', { error });
    state.reset();
  }

  return {
    // Getters
    getState: () => state.getState(),
    getActiveProfile: () => {
      const { profilesCache, activeProfileId } = state.getState();
      return profilesCache?.find(p => p.id === activeProfileId);
    },
    getAllProfiles: () => {
      const { profilesCache } = state.getState();
      return profilesCache ? [...profilesCache] : [DEFAULT_PROFILE];
    },
    getPromptSlot: (slot: PromptSlotType) => state.getState().promptCache[slot],

    // Setters
    setPromptSlot: (slot: PromptSlotType, value: string) => {
      state.updatePromptSlot(slot, value);
      savePromptsToStorage(state.getState().promptCache);

      const { activeProfileId, promptCache } = state.getState();
      if (activeProfileId) {
        updateProfileOnExtension(bridge, activeProfileId, promptCache);
      }
    },

    updatePrompts: (updates: Partial<ContextPrompt>) => {
      Object.entries(updates).forEach(([slot, value]) => {
        if (typeof value === 'string') {
          state.updatePromptSlot(slot as PromptSlotType, value);
        }
      });

      savePromptsToStorage(state.getState().promptCache);

      const { activeProfileId, promptCache } = state.getState();
      if (activeProfileId) {
        updateProfileOnExtension(bridge, activeProfileId, promptCache);
      }
    },

    // Profile Management
    switchProfile: (profileId: string) => {
      state.setActiveProfile(profileId);
      saveActiveProfileId(profileId);
    },

    // State Management
    reset: () => {
      state.reset();
      savePromptsToStorage(DEFAULT_PROMPTS);

      const { activeProfileId } = state.getState();
      if (activeProfileId) {
        updateProfileOnExtension(bridge, activeProfileId, DEFAULT_PROMPTS);
      }
    },

    // Subscriptions
    subscribe: (listener: (state: { 
      prompts: ContextPrompt; 
      activeProfile?: PromptProfile 
    }) => void) => {
      return state.subscribe(state => {
        const activeProfile = state.profilesCache?.find(p => p.id === state.activeProfileId);
        listener({
          prompts: state.promptCache,
          activeProfile
        });
      });
    },

    // Bridge Communication
    requestProfiles: () => requestProfiles(bridge),
    updateProfileOnExtension: (profileId: string, contextPrompt: ContextPrompt) => 
      updateProfileOnExtension(bridge, profileId, contextPrompt)
  };
}

// Types
export type { PromptManagerState, PromptSlotType };
export { PromptStateManager };

// Constants
export { DEFAULT_PROMPTS, DEFAULT_PROFILE };

/**
 * Inizializza il modulo context-prompt
 */
export async function initialize(): Promise<void> {
  // Inizializza gli handler dei messaggi
  initializeMessageHandlers();
  
  // Carica i profili dal localStorage o richiedi all'estensione
  const profiles = loadProfilesFromStorage();
  const activeProfileId = loadActiveProfileId();
  
  // Imposta lo stato iniziale
  promptStateManager.setProfilesCache(profiles);
  if (activeProfileId) {
    promptStateManager.setActiveProfileId(activeProfileId);
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    if (activeProfile) {
      promptStateManager.setPromptCache(activeProfile.contextPrompt);
    }
  }
  
  // Richiedi i profili all'estensione per sincronizzazione
  requestProfiles();
} 
 