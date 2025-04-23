import { vi } from 'vitest';
import { z } from 'zod';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebviewBridge } from '@shared/utils/WebviewBridge';
import { TelemetryMessageType, createTelemetryMessage } from '@shared/types/telemetry-message';
import { handleTelemetryMessage, handleTelemetryErrorMessage } from '../telemetry-handlers';
import { StateManager } from '@shared/state/StateManager';
import { TelemetryEvent, ErrorEvent } from '@shared/types/telemetry.types';

describe('Telemetry Message Handlers', () => {
  let mockBridge: jest.Mocked<WebviewBridge>;
  let mockStateManager: jest.Mocked<StateManager>;

  beforeEach(() => {
    mockBridge = {
      sendMessage: vi.fn(),
      on: vi.fn(),
      dispose: vi.fn(),
    } as any;

    mockStateManager = {
      updateTelemetryMetrics: vi.fn(),
      updateTelemetryProviders: vi.fn(),
      requestTelemetryData: vi.fn(),
      handleTelemetryError: vi.fn(),
      trackEvent: vi.fn(),
      getEvents: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleTelemetryMessage', () => {
    it('should handle DATA_UPDATED message with metrics and providers', async () => {
      const metrics = {
        totalRequests: 100,
        successRate: 0.95,
        averageResponseTime: 250,
        errorRate: 0.05,
        lastUpdated: Date.now(),
      };

      const providers = [
        {
          name: 'OpenAI',
          requests: 50,
          successCount: 48,
          failureCount: 2,
          averageResponseTime: 200,
          lastUsed: Date.now(),
        },
        {
          name: 'Anthropic',
          requests: 30,
          successCount: 29,
          failureCount: 1,
          averageResponseTime: 300,
          lastUsed: Date.now(),
        },
      ];

      const message = createTelemetryMessage(TelemetryMessageType.DATA_UPDATED, {
        metrics,
        providers,
      });

      await handleTelemetryMessage(message, mockStateManager, mockBridge);

      expect(mockStateManager.updateTelemetryMetrics).toHaveBeenCalledWith(metrics);
      expect(mockStateManager.updateTelemetryProviders).toHaveBeenCalledWith(providers);
      expect(mockStateManager.trackEvent).toHaveBeenCalledWith('telemetry.data_updated', {
        metricsUpdated: true,
        providersUpdated: true,
        providersCount: 2,
      });
    });

    it('should handle REQUEST_DATA message', async () => {
      const message = createTelemetryMessage(TelemetryMessageType.REQUEST_DATA, undefined);

      await handleTelemetryMessage(message, mockStateManager, mockBridge);

      expect(mockStateManager.requestTelemetryData).toHaveBeenCalled();
      expect(mockStateManager.trackEvent).toHaveBeenCalledWith('telemetry.data_requested', {
        timestamp: expect.any(Number),
      });
    });

    it('should handle partial data updates', async () => {
      const metrics = {
        totalRequests: 100,
        successRate: 0.95,
        averageResponseTime: 250,
        errorRate: 0.05,
        lastUpdated: Date.now(),
      };

      const message = createTelemetryMessage(TelemetryMessageType.DATA_UPDATED, {
        metrics,
        providers: [],
      });

      await handleTelemetryMessage(message, mockStateManager, mockBridge);

      expect(mockStateManager.updateTelemetryMetrics).toHaveBeenCalledWith(metrics);
      expect(mockStateManager.updateTelemetryProviders).not.toHaveBeenCalled();
      expect(mockStateManager.trackEvent).toHaveBeenCalledWith('telemetry.data_updated', {
        metricsUpdated: true,
        providersUpdated: false,
        providersCount: 0,
      });
    });

    it('should reject invalid message structure', async () => {
      const invalidMessage = {
        type: TelemetryMessageType.DATA_UPDATED,
        payload: {
          invalidField: 'test',
        },
      };

      await expect(handleTelemetryMessage(invalidMessage as any, mockStateManager, mockBridge))
        .rejects.toThrow('Invalid telemetry message structure');

      expect(mockStateManager.trackEvent).toHaveBeenCalledWith('telemetry.error', {
        error: 'Invalid telemetry message structure',
        code: 'INVALID_MESSAGE_STRUCTURE',
      });
    });
  });

  describe('handleTelemetryErrorMessage', () => {
    it('should handle error message with full details', async () => {
      const errorDetails = {
        message: 'Test error',
        stack: 'Error stack trace',
        code: 'TEST_ERROR',
      };

      const message = createTelemetryMessage(TelemetryMessageType.ERROR, {
        error: JSON.stringify(errorDetails),
      });

      await handleTelemetryErrorMessage(message, mockStateManager, mockBridge);

      expect(mockStateManager.handleTelemetryError).toHaveBeenCalledWith(errorDetails);
      expect(mockStateManager.trackEvent).toHaveBeenCalledWith('telemetry.error_handled', {
        errorCode: 'TEST_ERROR',
        hasStack: true,
      });
    });

    it('should handle error message with simple string', async () => {
      const message = createTelemetryMessage(TelemetryMessageType.ERROR, {
        error: 'Simple error message',
      });

      await handleTelemetryErrorMessage(message, mockStateManager, mockBridge);

      expect(mockStateManager.handleTelemetryError).toHaveBeenCalledWith({
        message: 'Simple error message',
        code: 'UNKNOWN_ERROR',
      });
      expect(mockStateManager.trackEvent).toHaveBeenCalledWith('telemetry.error_handled', {
        errorCode: 'UNKNOWN_ERROR',
        hasStack: false,
      });
    });

    it('should handle malformed JSON in error details', async () => {
      const message = createTelemetryMessage(TelemetryMessageType.ERROR, {
        error: '{invalid json',
      });

      await handleTelemetryErrorMessage(message, mockStateManager, mockBridge);

      expect(mockStateManager.handleTelemetryError).toHaveBeenCalledWith({
        message: '{invalid json',
        code: 'UNKNOWN_ERROR',
      });
      expect(mockStateManager.trackEvent).toHaveBeenCalledWith('telemetry.error_handled', {
        errorCode: 'UNKNOWN_ERROR',
        hasStack: false,
      });
    });

    it('should reject invalid error message structure', async () => {
      const invalidMessage = {
        type: TelemetryMessageType.ERROR,
        payload: {},
      };

      await expect(handleTelemetryErrorMessage(invalidMessage as any, mockStateManager, mockBridge))
        .rejects.toThrow('Invalid error message structure');

      expect(mockStateManager.trackEvent).toHaveBeenCalledWith('telemetry.error', {
        error: 'Invalid error message structure',
        code: 'INVALID_ERROR_MESSAGE',
      });
    });
  });
}); 
 