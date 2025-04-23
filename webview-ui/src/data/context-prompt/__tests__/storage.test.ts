import { vi } from 'vitest';
/**
 * @file storage.test.ts
 * @description Test per le funzioni di storage del modulo context-prompt
 * @author dev ai 1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ContextPrompt, PromptProfile } from '@shared/messages';
import {
  loadProfilesFromStorage,
  loadActiveProfileId,
  loadPromptsFromStorage,
  saveProfilesToStorage,
  saveActiveProfileId,
  savePromptsToStorage,
  resetStorage,
  clearStorage
} from '../storage';
import { DEFAULT_PROFILE, DEFAULT_PROMPTS, STORAGE_KEYS } from '../constants';

// Mock di localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0
};

// Mock del logger
vi.mock('@shared/utils/outputLogger', () => ({
  default: {
    createComponentLogger: () => ({
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    })
  }
}));

describe('Context Prompt Storage', () => {
  beforeEach(() => {
    // Setup localStorage mock
    global.localStorage = mockLocalStorage;
    
    // Reset tutti i mock prima di ogni test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup dopo ogni test
    vi.resetAllMocks();
  });

  describe('loadProfilesFromStorage', () => {
    it('should return null if no profiles are stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(loadProfilesFromStorage()).toBeNull();
    });

    it('should return profiles if valid data is stored', () => {
      const validProfiles: PromptProfile[] = [
        {
          id: 'test-1',
          name: 'Test Profile 1',
          contextPrompt: DEFAULT_PROMPTS,
          isDefault: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validProfiles));
      expect(loadProfilesFromStorage()).toEqual(validProfiles);
    });

    it('should return null and log warning if stored data is invalid', () => {
      mockLocalStorage.getItem.mockReturnValue('{"invalid": "data"}');
      expect(loadProfilesFromStorage()).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(loadProfilesFromStorage()).toBeNull();
    });
  });

  describe('loadActiveProfileId', () => {
    it('should return stored profile ID', () => {
      const profileId = 'test-profile-id';
      mockLocalStorage.getItem.mockReturnValue(profileId);
      expect(loadActiveProfileId()).toBe(profileId);
    });

    it('should return null if no ID is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(loadActiveProfileId()).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(loadActiveProfileId()).toBeNull();
    });
  });

  describe('loadPromptsFromStorage', () => {
    it('should return null if no prompts are stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(loadPromptsFromStorage()).toBeNull();
    });

    it('should return prompts if valid data is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(DEFAULT_PROMPTS));
      expect(loadPromptsFromStorage()).toEqual(DEFAULT_PROMPTS);
    });

    it('should return null and log warning if stored data is invalid', () => {
      mockLocalStorage.getItem.mockReturnValue('{"invalid": "prompt"}');
      expect(loadPromptsFromStorage()).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(loadPromptsFromStorage()).toBeNull();
    });
  });

  describe('saveProfilesToStorage', () => {
    it('should save profiles correctly', () => {
      const profiles: PromptProfile[] = [DEFAULT_PROFILE];
      saveProfilesToStorage(profiles);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PROMPT_PROFILES,
        JSON.stringify(profiles)
      );
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Non dovrebbe lanciare errori
      expect(() => saveProfilesToStorage([DEFAULT_PROFILE])).not.toThrow();
    });
  });

  describe('saveActiveProfileId', () => {
    it('should save profile ID correctly', () => {
      const profileId = 'test-profile-id';
      saveActiveProfileId(profileId);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACTIVE_PROFILE_ID,
        profileId
      );
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => saveActiveProfileId('test-id')).not.toThrow();
    });
  });

  describe('savePromptsToStorage', () => {
    it('should save prompts correctly', () => {
      savePromptsToStorage(DEFAULT_PROMPTS);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CONTEXT_PROMPT,
        JSON.stringify(DEFAULT_PROMPTS)
      );
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => savePromptsToStorage(DEFAULT_PROMPTS)).not.toThrow();
    });
  });

  describe('resetStorage', () => {
    it('should reset all storage to default values', () => {
      resetStorage();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.PROMPT_PROFILES,
        JSON.stringify([DEFAULT_PROFILE])
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACTIVE_PROFILE_ID,
        DEFAULT_PROFILE.id
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CONTEXT_PROMPT,
        JSON.stringify(DEFAULT_PROMPTS)
      );
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => resetStorage()).not.toThrow();
    });
  });

  describe('clearStorage', () => {
    it('should clear all context prompt related items from localStorage', () => {
      clearStorage();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.PROMPT_PROFILES);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACTIVE_PROFILE_ID);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.CONTEXT_PROMPT);
    });
  });
}); 
 