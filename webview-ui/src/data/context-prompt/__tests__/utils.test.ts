/**
 * @file utils.test.ts
 * @description Test per le funzioni di utilità del modulo context-prompt
 * @author dev ai 1
 */

import { describe, it, expect } from 'vitest';
import {
  generateProfileId,
  validateProfile,
  validatePrompts,
  mergePrompts,
  getDefaultProfile,
  getDefaultPrompts
} from '../utils';
import { DEFAULT_PROFILE, DEFAULT_PROMPTS } from '../constants';
import type { PromptProfile, ContextPrompt } from '../types';

describe('Context Prompt Utils', () => {
  describe('generateProfileId', () => {
    it('should generate a unique profile ID', () => {
      const id1 = generateProfileId();
      const id2 = generateProfileId();

      expect(id1).toMatch(/^profile-\d{13}$/);
      expect(id2).toMatch(/^profile-\d{13}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('validateProfile', () => {
    it('should validate a valid profile', () => {
      const profile: PromptProfile = {
        ...DEFAULT_PROFILE,
        id: 'test-profile',
        name: 'Test Profile'
      };

      expect(validateProfile(profile)).toBe(true);
    });

    it('should reject profile without required fields', () => {
      const invalidProfile = {
        id: 'test-profile'
      };

      expect(validateProfile(invalidProfile)).toBe(false);
    });

    it('should reject profile with invalid field types', () => {
      const invalidProfile = {
        ...DEFAULT_PROFILE,
        id: 123,
        name: true
      };

      expect(validateProfile(invalidProfile)).toBe(false);
    });
  });

  describe('validatePrompts', () => {
    it('should validate valid prompts', () => {
      const prompts: ContextPrompt = {
        ...DEFAULT_PROMPTS,
        system: 'Test system prompt',
        user: 'Test user prompt'
      };

      expect(validatePrompts(prompts)).toBe(true);
    });

    it('should reject prompts without required fields', () => {
      const invalidPrompts = {
        system: 'Test system prompt'
      };

      expect(validatePrompts(invalidPrompts)).toBe(false);
    });

    it('should reject prompts with invalid field types', () => {
      const invalidPrompts = {
        ...DEFAULT_PROMPTS,
        system: 123,
        user: true
      };

      expect(validatePrompts(invalidPrompts)).toBe(false);
    });
  });

  describe('mergePrompts', () => {
    it('should merge prompts with defaults', () => {
      const customPrompts: Partial<ContextPrompt> = {
        system: 'Custom system prompt',
        user: 'Custom user prompt'
      };

      const result = mergePrompts(customPrompts);

      expect(result).toEqual({
        ...DEFAULT_PROMPTS,
        ...customPrompts
      });
    });

    it('should handle undefined input', () => {
      const result = mergePrompts(undefined);

      expect(result).toEqual(DEFAULT_PROMPTS);
    });

    it('should handle partial prompts', () => {
      const partialPrompts: Partial<ContextPrompt> = {
        system: 'Custom system prompt'
      };

      const result = mergePrompts(partialPrompts);

      expect(result).toEqual({
        ...DEFAULT_PROMPTS,
        system: 'Custom system prompt'
      });
    });
  });

  describe('getDefaultProfile', () => {
    it('should return a copy of the default profile', () => {
      const profile = getDefaultProfile();

      expect(profile).toEqual(DEFAULT_PROFILE);
      expect(profile).not.toBe(DEFAULT_PROFILE);
    });

    it('should generate a unique ID for each call', () => {
      const profile1 = getDefaultProfile();
      const profile2 = getDefaultProfile();

      expect(profile1.id).not.toBe(profile2.id);
    });
  });

  describe('getDefaultPrompts', () => {
    it('should return a copy of the default prompts', () => {
      const prompts = getDefaultPrompts();

      expect(prompts).toEqual(DEFAULT_PROMPTS);
      expect(prompts).not.toBe(DEFAULT_PROMPTS);
    });

    it('should return a new object for each call', () => {
      const prompts1 = getDefaultPrompts();
      const prompts2 = getDefaultPrompts();

      expect(prompts1).not.toBe(prompts2);
    });
  });
}); 
 