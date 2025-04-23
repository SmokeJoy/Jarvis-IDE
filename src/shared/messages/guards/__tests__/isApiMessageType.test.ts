import { describe, it, expect } from 'vitest';
import { ApiMessageType } from '../../../types/api.types';
import {
  isApiMessage,
  isApiMessageOfType,
  isSetConfigurationMessage,
  isGetConfigurationMessage,
  isLoadModelsMessage,
  isFetchModelsMessage,
  isClearModelCacheMessage,
  isSendMessageMessage,
  isResetMessage,
  isNavigateMessage,
  isOpenRouteMessage,
  isToggleSidebarMessage,
  isToggleTerminalMessage,
  isSetThemeMessage,
  isSetFontSizeMessage,
  isPromptProfilesMessage,
  isPromptProfileUpdatedMessage,
  isTelemetryErrorMessage,
  isTelemetryEventMessage,
  isTelemetryMetricMessage,
  isApiErrorMessage
} from '../isApiMessageType';

describe('API Message Type Guards', () => {
  describe('isApiMessage', () => {
    it('should return true for valid API messages', () => {
      const validMessage = {
        type: ApiMessageType.SEND_MESSAGE,
        payload: { message: 'test' },
        timestamp: Date.now()
      };
      expect(isApiMessage(validMessage)).toBe(true);
    });

    it('should return false for invalid messages', () => {
      expect(isApiMessage(null)).toBe(false);
      expect(isApiMessage(undefined)).toBe(false);
      expect(isApiMessage({})).toBe(false);
      expect(isApiMessage({ type: 'INVALID' })).toBe(false);
      expect(isApiMessage({ type: ApiMessageType.SEND_MESSAGE })).toBe(false); // Missing payload
    });
  });

  describe('isApiMessageOfType', () => {
    it('should return true for messages of the specified type', () => {
      const message = {
        type: ApiMessageType.SEND_MESSAGE,
        payload: { message: 'test' }
      };
      expect(isApiMessageOfType(message, ApiMessageType.SEND_MESSAGE)).toBe(true);
    });

    it('should return false for messages of different types', () => {
      const message = {
        type: ApiMessageType.SEND_MESSAGE,
        payload: { message: 'test' }
      };
      expect(isApiMessageOfType(message, ApiMessageType.RESET)).toBe(false);
    });
  });

  // Configuration Messages
  describe('Configuration Message Guards', () => {
    it('should validate SET_CONFIGURATION messages', () => {
      const message = {
        type: ApiMessageType.SET_CONFIGURATION,
        payload: { config: { key: 'value' } }
      };
      expect(isSetConfigurationMessage(message)).toBe(true);
    });

    it('should validate GET_CONFIGURATION messages', () => {
      const message = {
        type: ApiMessageType.GET_CONFIGURATION,
        payload: {}
      };
      expect(isGetConfigurationMessage(message)).toBe(true);
    });
  });

  // Model Messages
  describe('Model Message Guards', () => {
    it('should validate LOAD_MODELS messages', () => {
      const message = {
        type: ApiMessageType.LOAD_MODELS,
        payload: { models: [] }
      };
      expect(isLoadModelsMessage(message)).toBe(true);
    });

    it('should validate FETCH_MODELS messages', () => {
      const message = {
        type: ApiMessageType.FETCH_MODELS,
        payload: { force: true }
      };
      expect(isFetchModelsMessage(message)).toBe(true);
    });

    it('should validate CLEAR_MODEL_CACHE messages', () => {
      const message = {
        type: ApiMessageType.CLEAR_MODEL_CACHE,
        payload: {}
      };
      expect(isClearModelCacheMessage(message)).toBe(true);
    });
  });

  // Chat Messages
  describe('Chat Message Guards', () => {
    it('should validate SEND_MESSAGE messages', () => {
      const message = {
        type: ApiMessageType.SEND_MESSAGE,
        payload: { message: 'test', modelId: 'gpt-4' }
      };
      expect(isSendMessageMessage(message)).toBe(true);
    });

    it('should validate RESET messages', () => {
      const message = {
        type: ApiMessageType.RESET,
        payload: {}
      };
      expect(isResetMessage(message)).toBe(true);
    });
  });

  // Navigation/UI Messages
  describe('Navigation/UI Message Guards', () => {
    it('should validate NAVIGATE messages', () => {
      const message = {
        type: ApiMessageType.NAVIGATE,
        payload: { route: '/home', params: { id: '123' } }
      };
      expect(isNavigateMessage(message)).toBe(true);
    });

    it('should validate OPEN_ROUTE messages', () => {
      const message = {
        type: ApiMessageType.OPEN_ROUTE,
        payload: { route: '/settings' }
      };
      expect(isOpenRouteMessage(message)).toBe(true);
    });

    it('should validate TOGGLE_SIDEBAR messages', () => {
      const message = {
        type: ApiMessageType.TOGGLE_SIDEBAR,
        payload: { visible: true }
      };
      expect(isToggleSidebarMessage(message)).toBe(true);
    });

    it('should validate TOGGLE_TERMINAL messages', () => {
      const message = {
        type: ApiMessageType.TOGGLE_TERMINAL,
        payload: { visible: false }
      };
      expect(isToggleTerminalMessage(message)).toBe(true);
    });

    it('should validate SET_THEME messages', () => {
      const message = {
        type: ApiMessageType.SET_THEME,
        payload: { theme: 'dark' }
      };
      expect(isSetThemeMessage(message)).toBe(true);
    });

    it('should validate SET_FONT_SIZE messages', () => {
      const message = {
        type: ApiMessageType.SET_FONT_SIZE,
        payload: { size: 14 }
      };
      expect(isSetFontSizeMessage(message)).toBe(true);
    });
  });

  // Prompt Profile Messages
  describe('Prompt Profile Message Guards', () => {
    it('should validate PROMPT_PROFILES messages', () => {
      const message = {
        type: ApiMessageType.PROMPT_PROFILES,
        payload: { profiles: [] }
      };
      expect(isPromptProfilesMessage(message)).toBe(true);
    });

    it('should validate PROMPT_PROFILE_UPDATED messages', () => {
      const message = {
        type: ApiMessageType.PROMPT_PROFILE_UPDATED,
        payload: { profile: { id: '123', name: 'test' } }
      };
      expect(isPromptProfileUpdatedMessage(message)).toBe(true);
    });
  });

  // Telemetry Messages
  describe('Telemetry Message Guards', () => {
    it('should validate TELEMETRY_ERROR messages', () => {
      const message = {
        type: ApiMessageType.TELEMETRY_ERROR,
        payload: { error: 'test error', details: { stack: 'trace' } }
      };
      expect(isTelemetryErrorMessage(message)).toBe(true);
    });

    it('should validate TELEMETRY_EVENT messages', () => {
      const message = {
        type: ApiMessageType.TELEMETRY_EVENT,
        payload: { event: 'test_event', properties: { key: 'value' } }
      };
      expect(isTelemetryEventMessage(message)).toBe(true);
    });

    it('should validate TELEMETRY_METRIC messages', () => {
      const message = {
        type: ApiMessageType.TELEMETRY_METRIC,
        payload: { name: 'test_metric', value: 42, tags: { env: 'test' } }
      };
      expect(isTelemetryMetricMessage(message)).toBe(true);
    });
  });

  // Error Messages
  describe('Error Message Guards', () => {
    it('should validate API_ERROR messages', () => {
      const message = {
        type: ApiMessageType.API_ERROR,
        payload: { error: 'test error', details: { code: 500 } }
      };
      expect(isApiErrorMessage(message)).toBe(true);
    });
  });

  // Invalid Payloads
  describe('Invalid Payload Validation', () => {
    it('should reject messages with invalid payloads', () => {
      const invalidMessages = [
        {
          type: ApiMessageType.SEND_MESSAGE,
          payload: {} // Missing required message field
        },
        {
          type: ApiMessageType.SET_THEME,
          payload: { theme: 'invalid' } // Invalid theme value
        },
        {
          type: ApiMessageType.SET_FONT_SIZE,
          payload: { size: 'large' } // Invalid size type
        },
        {
          type: ApiMessageType.TELEMETRY_METRIC,
          payload: { name: 'test', value: 'not a number' } // Invalid value type
        }
      ];

      invalidMessages.forEach(message => {
        expect(isApiMessage(message)).toBe(false);
      });
    });
  });
});

describe('isApiMessageType', () => {
    it('should return true for valid API message types', () => {
        const validTypes: ApiMessageType[] = [
            'api.request',
            'api.response',
            'api.error',
            'api.stream.start',
            'api.stream.data',
            'api.stream.end'
        ];

        validTypes.forEach(type => {
            expect(isApiMessageType(type)).toBe(true);
        });
    });

    it('should return false for invalid API message types', () => {
        const invalidTypes = [
            'invalid.type',
            'api',
            'api.',
            'api.invalid',
            '',
            null,
            undefined,
            123,
            {},
            []
        ];

        invalidTypes.forEach(type => {
            expect(isApiMessageType(type)).toBe(false);
        });
    });
}); 