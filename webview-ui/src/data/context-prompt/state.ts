/**
 * @file state.ts
 * @description Gestione dello stato per il modulo context-prompt
 * @author dev ai 1
 */

import type { ContextPrompt, PromptProfile } from './types';
import { DEFAULT_PROFILE, DEFAULT_PROMPTS } from './constants';
import type { PromptState } from './types';
import logger from '@shared/utils/outputLogger';

// Logger specifico per questo componente
const componentLogger = logger.createComponentLogger('ContextPromptState');

// Stato iniziale
const initialState: PromptState = {
  promptCache: { ...DEFAULT_PROMPTS },
  profilesCache: null,
  activeProfileId: null
};

// Singleton per lo stato
class PromptStateManager {
  private static instance: PromptStateManager;
  private state: PromptState;

  private constructor() {
    this.state = { ...initialState };
  }

  public static getInstance(): PromptStateManager {
    if (!PromptStateManager.instance) {
      PromptStateManager.instance = new PromptStateManager();
    }
    return PromptStateManager.instance;
  }

  // Getters
  public getPromptCache(): Readonly<ContextPrompt> {
    return { ...this.state.promptCache };
  }

  public getProfilesCache(): ReadonlyArray<PromptProfile> | null {
    return this.state.profilesCache ? [...this.state.profilesCache] : null;
  }

  public getActiveProfileId(): string | null {
    return this.state.activeProfileId;
  }

  public getActiveProfile(): Readonly<PromptProfile> | undefined {
    if (!this.state.profilesCache || !this.state.activeProfileId) {
      return undefined;
    }
    return this.state.profilesCache.find(p => p.id === this.state.activeProfileId);
  }

  // Setters
  public setPromptCache(prompts: ContextPrompt): void {
    this.state.promptCache = { ...prompts };
    componentLogger.debug('Prompt cache aggiornata', { prompts });
  }

  public setProfilesCache(profiles: PromptProfile[]): void {
    this.state.profilesCache = [...profiles];
    componentLogger.debug('Profiles cache aggiornata', { count: profiles.length });
  }

  public setActiveProfileId(profileId: string | null): void {
    this.state.activeProfileId = profileId;
    componentLogger.debug('Active profile ID aggiornato', { profileId });
  }

  // Reset
  public resetState(): void {
    this.state = {
      promptCache: { ...DEFAULT_PROMPTS },
      profilesCache: [DEFAULT_PROFILE],
      activeProfileId: DEFAULT_PROFILE.id
    };
    componentLogger.info('Stato resettato ai valori predefiniti');
  }

  // Utility methods
  public updatePromptSlot(slot: keyof ContextPrompt, value: string): void {
    this.state.promptCache = {
      ...this.state.promptCache,
      [slot]: value
    };
    componentLogger.debug('Slot prompt aggiornato', { slot, value });
  }

  public updatePrompts(updates: Partial<ContextPrompt>): void {
    this.state.promptCache = {
      ...this.state.promptCache,
      ...updates
    };
    componentLogger.debug('Prompt aggiornati', { updates });
  }
}

// Esporta l'istanza singleton
export const promptStateManager = PromptStateManager.getInstance(); 
 
 