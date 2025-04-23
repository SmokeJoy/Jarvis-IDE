import { describe, it, expect } from 'vitest';
import { isPromptProfilesMessage, isPromptProfilePayload, isPromptProfile } from '../prompt-messages';
import { DEFAULT_PROMPTS } from '../../../../webview-ui/src/data/context-prompt/constants';

describe('Prompt Message Guards', () => {
  describe('isPromptProfilesMessage', () => {
    it('should validate promptProfiles message shape', () => {
      expect(isPromptProfilesMessage({ type: 'promptProfiles' })).toBe(true);
      expect(isPromptProfilesMessage({ type: 'other' })).toBe(false);
      expect(isPromptProfilesMessage(null)).toBe(false);
      expect(isPromptProfilesMessage(undefined)).toBe(false);
      expect(isPromptProfilesMessage(123)).toBe(false);
    });
  });

  describe('isPromptProfile', () => {
    it('should validate valid PromptProfile structure', () => {
      const validProfile = {
        id: '123',
        name: 'Test Profile',
        contextPrompt: DEFAULT_PROMPTS
      };
      expect(isPromptProfile(validProfile)).toBe(true);
    });

    it('should reject invalid PromptProfile structures', () => {
      expect(isPromptProfile({})).toBe(false);
      expect(isPromptProfile({ id: 123, name: 'Test' })).toBe(false);
      expect(isPromptProfile({ id: 'test' })).toBe(false);
      expect(isPromptProfile(null)).toBe(false);
      expect(isPromptProfile(undefined)).toBe(false);
    });
  });

  describe('isPromptProfilePayload', () => {
    it('should validate valid payload structure', () => {
      const payload = {
        profiles: [
          { id: '123', name: 'Default', contextPrompt: DEFAULT_PROMPTS }
        ]
      };
      expect(isPromptProfilePayload(payload)).toBe(true);
    });

    it('should reject invalid payload structures', () => {
      expect(isPromptProfilePayload({})).toBe(false);
      expect(isPromptProfilePayload({ profiles: [{}] })).toBe(false);
      expect(isPromptProfilePayload({ profiles: 'not-an-array' })).toBe(false);
      expect(isPromptProfilePayload(null)).toBe(false);
      expect(isPromptProfilePayload(undefined)).toBe(false);
    });

    it('should reject payload with invalid profiles', () => {
      const invalidPayload = {
        profiles: [
          { id: 123, name: 'Invalid' }, // id dovrebbe essere string
          { name: 'Missing ID' } // manca id
        ]
      };
      expect(isPromptProfilePayload(invalidPayload)).toBe(false);
    });
  });
}); 
 