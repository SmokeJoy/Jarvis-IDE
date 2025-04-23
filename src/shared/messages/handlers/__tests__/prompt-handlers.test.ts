import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePromptProfilesMessage, handlePromptProfileUpdatedMessage } from '../prompt-handlers';
import { PromptProfile } from '../../../types/prompt.types';
import { DEFAULT_PROMPTS } from '../../../../webview-ui/src/data/context-prompt/constants';

describe('Prompt Message Handlers', () => {
  let mockContext: {
    bridge: {
      sendMessage: (message: unknown) => void;
    };
    state: {
      setProfiles: (profiles: PromptProfile[]) => void;
      updateProfile: (profile: PromptProfile) => void;
    };
  };

  beforeEach(() => {
    mockContext = {
      bridge: {
        sendMessage: vi.fn()
      },
      state: {
        setProfiles: vi.fn(),
        updateProfile: vi.fn()
      }
    };
  });

  describe('handlePromptProfilesMessage', () => {
    it('should handle valid promptProfiles message', () => {
      const validMessage = {
        type: 'promptProfiles',
        payload: {
          profiles: [
            { id: '123', name: 'Test Profile', contextPrompt: DEFAULT_PROMPTS }
          ]
        }
      };

      handlePromptProfilesMessage(validMessage, mockContext);
      expect(mockContext.state.setProfiles).toHaveBeenCalledWith((msg.payload as unknown).profiles);
    });

    it('should handle error in promptProfiles message', () => {
      const messageWithError = {
        type: 'promptProfiles',
        error: 'Failed to load profiles'
      };

      handlePromptProfilesMessage(messageWithError, mockContext);
      expect(mockContext.bridge.sendMessage).toHaveBeenCalledWith({
        type: 'error',
        payload: { message: 'Failed to load profiles' }
      });
    });

    it('should reject invalid message structure', () => {
      const invalidMessage = {
        type: 'promptProfiles',
        payload: { profiles: 'not-an-array' }
      };

      expect(() => handlePromptProfilesMessage(invalidMessage, mockContext)).toThrow();
    });
  });

  describe('handlePromptProfileUpdatedMessage', () => {
    it('should handle valid profile update message', () => {
      const validMessage = {
        type: 'promptProfileUpdated',
        payload: {
          profile: { id: '123', name: 'Updated Profile', contextPrompt: DEFAULT_PROMPTS }
        }
      };

      handlePromptProfileUpdatedMessage(validMessage, mockContext);
      expect(mockContext.state.updateProfile).toHaveBeenCalledWith((msg.payload as unknown).profile);
    });

    it('should handle error in profile update message', () => {
      const messageWithError = {
        type: 'promptProfileUpdated',
        error: 'Failed to update profile'
      };

      handlePromptProfileUpdatedMessage(messageWithError, mockContext);
      expect(mockContext.bridge.sendMessage).toHaveBeenCalledWith({
        type: 'error',
        payload: { message: 'Failed to update profile' }
      });
    });

    it('should reject invalid profile structure', () => {
      const invalidMessage = {
        type: 'promptProfileUpdated',
        payload: {
          profile: { id: 123, name: 'Invalid' } // id dovrebbe essere string
        }
      };

      expect(() => handlePromptProfileUpdatedMessage(invalidMessage, mockContext)).toThrow();
    });
  });
}); 
 