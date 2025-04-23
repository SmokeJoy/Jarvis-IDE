/**
 * @file types.ts
 * @description Tipi centralizzati per il modulo context-prompt
 * @author dev ai 1
 */

import type { 
  ContextPrompt,
  PromptProfile as ImportedPromptProfile
} from '@shared/messages';
import type { WebviewBridge } from '@shared/utils/WebviewBridge';

// Re-export del tipo PromptProfile per retrocompatibilità
export type PromptProfile = ImportedPromptProfile;

// Tipi di slot di prompt disponibili
export type PromptSlotType = keyof ContextPrompt;

// Stato in memoria per cache
export interface PromptState {
  promptCache: ContextPrompt;
  profilesCache: PromptProfile[] | null;
  activeProfileId: string | null;
}

// Chiavi per lo storage locale
export const STORAGE_KEYS = {
  CONTEXT_PROMPT: 'jarvis.contextPrompts',
  PROMPT_PROFILES: 'jarvis.promptProfiles',
  ACTIVE_PROFILE_ID: 'jarvis.activePromptProfileId'
} as const;

// Interfaccia per il contesto MAS
export interface MasContext {
  contextPrompt: string;
  agentId: string;
  threadId: string;
}

export interface PromptManagerState {
  promptCache: ContextPrompt;
  profilesCache: PromptProfile[] | null;
  activeProfileId: string | null;
}

export interface PromptManagerContext {
  bridge: WebviewBridge;
  state: {
    getState: () => PromptManagerState;
    setProfiles: (profiles: PromptProfile[]) => void;
    setActiveProfile: (profileId: string) => void;
    updatePromptSlot: (slot: PromptSlotType, value: string) => void;
    reset: () => void;
  };
} 
 