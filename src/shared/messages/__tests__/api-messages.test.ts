import { describe, it, expect } from 'vitest';
import {
  ApiMessageType,
  isApiMessage,
  type NavigateMessage,
  type OpenRouteMessage,
  type ToggleSidebarMessage,
  type ToggleTerminalMessage,
  type SetThemeMessage,
  type SetFontSizeMessage,
  type FetchModelsMessage,
  type ClearModelCacheMessage,
  type PromptProfilesMessage,
  type PromptProfileUpdatedMessage,
  type TelemetryDataMessage,
  type TelemetryErrorMessage
} from '../api-messages';

describe('API Message Type Guards', () => {
  describe('isApiMessage', () => {
    it('should return false for null or undefined', () => {
      expect(isApiMessage(null)).toBe(false);
      expect(isApiMessage(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isApiMessage('string')).toBe(false);
      expect(isApiMessage(123)).toBe(false);
      expect(isApiMessage(true)).toBe(false);
    });

    it('should return false for objects without type', () => {
      expect(isApiMessage({})).toBe(false);
      expect(isApiMessage({ payload: {} })).toBe(false);
    });

    it('should return false for objects with invalid type', () => {
      expect(isApiMessage({ type: 'invalid', payload: {} })).toBe(false);
    });

    it('should return false for objects without payload', () => {
      expect(isApiMessage({ type: ApiMessageType.NAVIGATE })).toBe(false);
    });

    it('should validate NavigateMessage', () => {
      const validMessage: NavigateMessage = {
        type: ApiMessageType.NAVIGATE,
        payload: { route: '/test' }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.NAVIGATE,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate OpenRouteMessage', () => {
      const validMessage: OpenRouteMessage = {
        type: ApiMessageType.OPEN_ROUTE,
        payload: { route: '/test' }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.OPEN_ROUTE,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate ToggleSidebarMessage', () => {
      const validMessage: ToggleSidebarMessage = {
        type: ApiMessageType.TOGGLE_SIDEBAR,
        payload: { visible: true }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.TOGGLE_SIDEBAR,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate ToggleTerminalMessage', () => {
      const validMessage: ToggleTerminalMessage = {
        type: ApiMessageType.TOGGLE_TERMINAL,
        payload: { visible: false }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.TOGGLE_TERMINAL,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate SetThemeMessage', () => {
      const validMessage: SetThemeMessage = {
        type: ApiMessageType.SET_THEME,
        payload: { theme: 'dark' }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.SET_THEME,
        payload: { theme: 'invalid' }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate SetFontSizeMessage', () => {
      const validMessage: SetFontSizeMessage = {
        type: ApiMessageType.SET_FONT_SIZE,
        payload: { size: 14 }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.SET_FONT_SIZE,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate FetchModelsMessage', () => {
      const validMessage1: FetchModelsMessage = {
        type: ApiMessageType.FETCH_MODELS,
        payload: {}
      };
      expect(isApiMessage(validMessage1)).toBe(true);

      const validMessage2: FetchModelsMessage = {
        type: ApiMessageType.FETCH_MODELS,
        payload: { forceRefresh: true }
      };
      expect(isApiMessage(validMessage2)).toBe(true);
    });

    it('should validate ClearModelCacheMessage', () => {
      const validMessage: ClearModelCacheMessage = {
        type: ApiMessageType.CLEAR_MODEL_CACHE,
        payload: {}
      };
      expect(isApiMessage(validMessage)).toBe(true);
    });

    it('should validate PromptProfilesMessage', () => {
      const validMessage: PromptProfilesMessage = {
        type: ApiMessageType.PROMPT_PROFILES,
        payload: {
          profiles: [{
            id: '1',
            name: 'Test',
            description: 'Test Profile',
            prompt: 'Test prompt'
          }]
        }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.PROMPT_PROFILES,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate PromptProfileUpdatedMessage', () => {
      const validMessage: PromptProfileUpdatedMessage = {
        type: ApiMessageType.PROMPT_PROFILE_UPDATED,
        payload: {
          profile: {
            id: '1',
            name: 'Test',
            description: 'Test Profile',
            prompt: 'Test prompt'
          }
        }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.PROMPT_PROFILE_UPDATED,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate TelemetryDataMessage', () => {
      const validMessage: TelemetryDataMessage = {
        type: ApiMessageType.TELEMETRY_DATA,
        payload: {
          metrics: { requests: 10 },
          providers: ['openai']
        }
      };
      expect(isApiMessage(validMessage)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.TELEMETRY_DATA,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });

    it('should validate TelemetryErrorMessage', () => {
      const validMessage1: TelemetryErrorMessage = {
        type: ApiMessageType.TELEMETRY_ERROR,
        payload: { error: 'Test error' }
      };
      expect(isApiMessage(validMessage1)).toBe(true);

      const validMessage2: TelemetryErrorMessage = {
        type: ApiMessageType.TELEMETRY_ERROR,
        payload: { error: 'Test error', details: { code: 500 } }
      };
      expect(isApiMessage(validMessage2)).toBe(true);

      const invalidMessage = {
        type: ApiMessageType.TELEMETRY_ERROR,
        payload: { invalid: true }
      };
      expect(isApiMessage(invalidMessage)).toBe(false);
    });
  });
}); 