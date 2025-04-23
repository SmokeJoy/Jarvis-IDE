import { describe, it, expect } from 'vitest';
import { 
  isExtensionPromptMessage,
  type ExtensionPromptMessage,
  type PromptProfile
} from '@shared/messages';

describe('Message Type Guards', () => {
  describe('isExtensionPromptMessage', () => {
    it('should return true for valid promptProfiles message', () => {
      const message: ExtensionPromptMessage = {
        type: 'promptProfiles',
        payload: {
          profiles: [] as PromptProfile[]
        }
      };
      
      expect(isExtensionPromptMessage(message)).toBe(true);
    });

    it('should return true for valid promptProfileUpdated message', () => {
      const message: ExtensionPromptMessage = {
        type: 'promptProfileUpdated',
        payload: {
          profile: {} as PromptProfile
        }
      };
      
      expect(isExtensionPromptMessage(message)).toBe(true);
    });

    it('should return true for message with error field', () => {
      const message: ExtensionPromptMessage = {
        type: 'promptProfiles',
        payload: {
          profiles: []
        },
        error: 'Failed to load profiles'
      };
      
      expect(isExtensionPromptMessage(message)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isExtensionPromptMessage(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isExtensionPromptMessage(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isExtensionPromptMessage('not an object')).toBe(false);
      expect(isExtensionPromptMessage(123)).toBe(false);
      expect(isExtensionPromptMessage(true)).toBe(false);
    });

    it('should return false for object without type field', () => {
      const message = {
        payload: {
          profiles: []
        }
      };
      
      expect(isExtensionPromptMessage(message)).toBe(false);
    });

    it('should return false for object with invalid type', () => {
      const message = {
        type: 'invalidType',
        payload: {
          profiles: []
        }
      };
      
      expect(isExtensionPromptMessage(message)).toBe(false);
    });
  });
}); 
 