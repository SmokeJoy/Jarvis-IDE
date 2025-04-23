import { vi } from 'vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptStateManager } from '../state';
import { DEFAULT_PROMPTS, DEFAULT_PROFILE } from '../constants';
import type { ContextPrompt, PromptProfile } from '@shared/messages';

describe('PromptStateManager', () => {
  let stateManager: PromptStateManager;

  beforeEach(() => {
    stateManager = new PromptStateManager();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const state = stateManager.getState();
      expect(state.promptCache).toEqual(DEFAULT_PROMPTS);
      expect(state.profilesCache).toBeNull();
      expect(state.activeProfileId).toBeNull();
    });

    it('should accept partial initial state', () => {
      const customPrompts: ContextPrompt = {
        ...DEFAULT_PROMPTS,
        system: 'Custom system prompt'
      };
      
      stateManager = new PromptStateManager({
        promptCache: customPrompts
      });

      const state = stateManager.getState();
      expect(state.promptCache).toEqual(customPrompts);
      expect(state.profilesCache).toBeNull();
      expect(state.activeProfileId).toBeNull();
    });
  });

  describe('state updates', () => {
    it('should update state immutably', () => {
      const initialState = stateManager.getState();
      const newPrompts = { ...DEFAULT_PROMPTS, system: 'New system prompt' };
      
      stateManager.setState({ promptCache: newPrompts });
      
      const newState = stateManager.getState();
      expect(newState).not.toBe(initialState); // Verifica immutabilità
      expect(newState.promptCache).toEqual(newPrompts);
    });

    it('should notify listeners only on actual changes', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);

      // Update con lo stesso stato - non dovrebbe notificare
      stateManager.setState({ promptCache: { ...stateManager.getState().promptCache } });
      expect(listener).not.toHaveBeenCalled();

      // Update con stato diverso - dovrebbe notificare
      stateManager.setState({ promptCache: { ...DEFAULT_PROMPTS, system: 'New prompt' } });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('profile management', () => {
    const testProfiles: PromptProfile[] = [
      {
        ...DEFAULT_PROFILE,
        id: 'test1',
        name: 'Test Profile 1',
        isDefault: true
      },
      {
        ...DEFAULT_PROFILE,
        id: 'test2',
        name: 'Test Profile 2',
        isDefault: false
      }
    ];

    it('should set profiles and select default profile', () => {
      stateManager.setProfiles(testProfiles);
      
      const state = stateManager.getState();
      expect(state.profilesCache).toEqual(testProfiles);
      expect(state.activeProfileId).toBe('test1'); // Il profilo default
    });

    it('should select first profile if no default exists', () => {
      const profilesWithoutDefault = testProfiles.map(p => ({ ...p, isDefault: false }));
      stateManager.setProfiles(profilesWithoutDefault);
      
      const state = stateManager.getState();
      expect(state.activeProfileId).toBe('test1'); // Il primo profilo
    });

    it('should maintain active profile if already set', () => {
      stateManager.setState({ activeProfileId: 'test2' });
      stateManager.setProfiles(testProfiles);
      
      const state = stateManager.getState();
      expect(state.activeProfileId).toBe('test2'); // Mantiene il profilo attivo
    });

    it('should update prompt cache when setting active profile', () => {
      const customPrompts = { ...DEFAULT_PROMPTS, system: 'Custom system prompt' };
      const profileWithCustomPrompts = { ...testProfiles[0], contextPrompt: customPrompts };
      
      stateManager.setProfiles([profileWithCustomPrompts, testProfiles[1]]);
      stateManager.setActiveProfile(profileWithCustomPrompts.id);
      
      const state = stateManager.getState();
      expect(state.promptCache).toEqual(customPrompts);
    });

    it('should not update state for non-existent profile', () => {
      const initialState = stateManager.getState();
      stateManager.setProfiles(testProfiles);
      stateManager.setActiveProfile('non-existent-id');
      
      const newState = stateManager.getState();
      expect(newState.activeProfileId).toBe(initialState.activeProfileId);
    });
  });

  describe('prompt slot management', () => {
    it('should update single prompt slot', () => {
      const newSystemPrompt = 'New system prompt';
      stateManager.setPromptSlot('system', newSystemPrompt);
      
      const state = stateManager.getState();
      expect(state.promptCache.system).toBe(newSystemPrompt);
      expect(state.promptCache.user).toBe(DEFAULT_PROMPTS.user); // Altri slot non modificati
    });
  });

  describe('reset functionality', () => {
    it('should reset state to defaults', () => {
      // Setup stato non-default
      stateManager.setState({
        promptCache: { ...DEFAULT_PROMPTS, system: 'Custom prompt' },
        profilesCache: [{ ...DEFAULT_PROFILE, name: 'Custom Profile' }],
        activeProfileId: 'custom-id'
      });

      stateManager.reset();
      
      const state = stateManager.getState();
      expect(state.promptCache).toEqual(DEFAULT_PROMPTS);
      expect(state.profilesCache).toEqual([DEFAULT_PROFILE]);
      expect(state.activeProfileId).toBe(DEFAULT_PROFILE.id);
    });
  });

  describe('subscription management', () => {
    it('should handle multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      const unsubscribe1 = stateManager.subscribe(listener1);
      const unsubscribe2 = stateManager.subscribe(listener2);
      
      stateManager.setState({ promptCache: { ...DEFAULT_PROMPTS, system: 'New prompt' } });
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      
      unsubscribe1();
      stateManager.setState({ activeProfileId: 'test' });
      
      expect(listener1).toHaveBeenCalledTimes(1); // Non chiamato dopo unsubscribe
      expect(listener2).toHaveBeenCalledTimes(2); // Chiamato di nuovo
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      
      stateManager.subscribe(errorListener);
      stateManager.subscribe(goodListener);
      
      // Non dovrebbe lanciare errori e dovrebbe chiamare entrambi i listener
      stateManager.setState({ activeProfileId: 'test' });
      
      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
    });

    it('should provide current state to listeners', () => {
      const listener = vi.fn();
      stateManager.subscribe(listener);
      
      const newPrompts = { ...DEFAULT_PROMPTS, system: 'New system prompt' };
      stateManager.setState({ promptCache: newPrompts });
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        promptCache: newPrompts
      }));
    });
  });
}); 
 