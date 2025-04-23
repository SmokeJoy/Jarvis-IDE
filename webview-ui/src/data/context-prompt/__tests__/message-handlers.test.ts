import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExtensionMessage, WebviewMessage } from '@shared/types/webview.types';
import { WebviewMessageType } from '@shared/types/webview.types';
import type { PromptManagerContext } from '../types';
import {
  handlePromptProfilesMessage,
  handlePromptProfileUpdatedMessage,
  registerMessageHandlers,
  requestProfiles,
  updateProfileOnExtension
} from '../message-handlers';
import { DEFAULT_PROFILE, DEFAULT_PROMPTS } from '../constants';
import { PayloadValidationError } from '@shared/errors/PayloadValidationError';

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

describe('Prompt Message Handlers', () => {
  let mockContext: PromptManagerContext;
  let mockState: {
    getState: vi.Mock;
    setProfiles: vi.Mock;
    setActiveProfile: vi.Mock;
    updatePromptSlot: vi.Mock;
    reset: vi.Mock;
  };
  let mockBridge: {
    sendMessage: vi.Mock;
    on: vi.Mock;
  };

  beforeEach(() => {
    mockState = {
      getState: vi.fn().mockReturnValue({
        profilesCache: [DEFAULT_PROFILE],
        activeProfileId: DEFAULT_PROFILE.id,
        promptCache: DEFAULT_PROMPTS
      }),
      setProfiles: vi.fn(),
      setActiveProfile: vi.fn(),
      updatePromptSlot: vi.fn(),
      reset: vi.fn()
    };

    mockBridge = {
      sendMessage: vi.fn(),
      on: vi.fn()
    };

    mockContext = {
      bridge: mockBridge,
      state: mockState
    };

    vi.clearAllMocks();
  });

  describe('handlePromptProfilesMessage', () => {
    it('should handle valid promptProfiles message', () => {
      const validMessage: ExtensionMessage = {
        type: WebviewMessageType.GET_PROMPT_PROFILES,
        payload: {
          profiles: [DEFAULT_PROFILE]
        }
      };

      handlePromptProfilesMessage(validMessage, mockContext);

      expect(mockState.setProfiles).toHaveBeenCalledWith([DEFAULT_PROFILE]);
    });

    it('should handle error in promptProfiles message', () => {
      const errorMessage: ExtensionMessage = {
        type: WebviewMessageType.GET_PROMPT_PROFILES,
        error: 'Failed to load profiles'
      };

      handlePromptProfilesMessage(errorMessage, mockContext);

      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.ERROR,
        payload: { message: 'Failed to load profiles' }
      });
      expect(mockState.setProfiles).not.toHaveBeenCalled();
    });

    it('should handle invalid message type', () => {
      const invalidMessage = {
        type: 'wrongType',
        payload: { profiles: [] }
      };

      handlePromptProfilesMessage(invalidMessage as ExtensionMessage, mockContext);

      expect(mockState.setProfiles).not.toHaveBeenCalled();
      expect(mockBridge.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('handlePromptProfileUpdatedMessage', () => {
    it('should handle valid profile update message', () => {
      const updatedProfile = {
        ...DEFAULT_PROFILE,
        name: 'Updated Profile'
      };

      const validMessage: ExtensionMessage = {
        type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
        payload: {
          profile: updatedProfile
        }
      };

      handlePromptProfileUpdatedMessage(validMessage, mockContext);

      expect(mockState.setProfiles).toHaveBeenCalledWith([updatedProfile]);
    });

    it('should update active profile if matching ID', () => {
      const updatedProfile = {
        ...DEFAULT_PROFILE,
        name: 'Updated Active Profile'
      };

      mockState.getState.mockReturnValue({
        profilesCache: [DEFAULT_PROFILE],
        activeProfileId: DEFAULT_PROFILE.id,
        promptCache: DEFAULT_PROMPTS
      });

      const validMessage: ExtensionMessage = {
        type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
        payload: {
          profile: updatedProfile
        }
      };

      handlePromptProfileUpdatedMessage(validMessage, mockContext);

      expect(mockState.setActiveProfile).toHaveBeenCalledWith(updatedProfile.id);
    });

    it('should handle error in profile update message', () => {
      const errorMessage: ExtensionMessage = {
        type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
        error: 'Failed to update profile'
      };

      handlePromptProfileUpdatedMessage(errorMessage, mockContext);

      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.ERROR,
        payload: { message: 'Failed to update profile' }
      });
      expect(mockState.setProfiles).not.toHaveBeenCalled();
    });

    it('should throw on invalid message type', () => {
      const invalidMessage = {
        type: 'wrongType',
        payload: { profile: DEFAULT_PROFILE }
      };

      expect(() => handlePromptProfileUpdatedMessage(invalidMessage as any, mockContext))
        .toThrow(PayloadValidationError);
    });

    it('should throw on invalid profile structure', () => {
      const invalidMessage = {
        type: 'promptProfileUpdated',
        payload: { profile: { invalid: true } }
      };

      expect(() => handlePromptProfileUpdatedMessage(invalidMessage as any, mockContext))
        .toThrow(PayloadValidationError);
    });
  });

  describe('registerMessageHandlers', () => {
    it('should register all message handlers', () => {
      registerMessageHandlers(mockContext);

      expect(mockBridge.on).toHaveBeenCalledTimes(2);
      expect(mockBridge.on).toHaveBeenCalledWith(
        WebviewMessageType.GET_PROMPT_PROFILES,
        expect.any(Function)
      );
      expect(mockBridge.on).toHaveBeenCalledWith(
        WebviewMessageType.UPDATE_PROMPT_PROFILE,
        expect.any(Function)
      );
    });

    it('should register handlers that forward messages correctly', () => {
      registerMessageHandlers(mockContext);

      // Estrai gli handler registrati
      const [[, profilesHandler], [, updateHandler]] = mockBridge.on.mock.calls;

      const profilesMessage: ExtensionMessage = {
        type: WebviewMessageType.GET_PROMPT_PROFILES,
        payload: {
          profiles: [DEFAULT_PROFILE]
        }
      };

      profilesHandler(profilesMessage);
      expect(mockState.setProfiles).toHaveBeenCalledWith([DEFAULT_PROFILE]);

      const updateMessage: ExtensionMessage = {
        type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
        payload: {
          profile: DEFAULT_PROFILE
        }
      };

      updateHandler(updateMessage);
      expect(mockState.setProfiles).toHaveBeenCalled();
    });
  });

  describe('requestProfiles and updateProfileOnExtension', () => {
    it('should send getPromptProfiles request', () => {
      requestProfiles(mockBridge);

      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.GET_PROMPT_PROFILES
      });
    });

    it('should send profile update request', () => {
      const profileId = 'test-id';
      const contextPrompt = DEFAULT_PROMPTS;

      updateProfileOnExtension(mockBridge, profileId, contextPrompt);

      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
        payload: {
          profileId,
          contextPrompt
        }
      });
    });
  });
}); 
 