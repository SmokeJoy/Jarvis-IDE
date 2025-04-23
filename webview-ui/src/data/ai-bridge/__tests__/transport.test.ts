import { vi } from 'vitest';
/**
 * @file transport.test.ts
 * @description Test per il transport del modulo ai-bridge
 * @author dev ai 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebviewMessageType } from '@shared/messages';
import {
  sendAiRequest,
  cancelAiRequest,
  requestAiStatus,
  sendResetMessage
} from '../transport';

// Mock del logger
vi.mock('@shared/utils/outputLogger', () => ({
  default: {
    createComponentLogger: () => ({
      debug: vi.fn()
    })
  }
}));

describe('AI Bridge Transport', () => {
  const mockBridge = {
    sendMessage: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendAiRequest', () => {
    it('should send request with generated ID', () => {
      const request = {
        prompt: 'Test prompt',
        options: { temperature: 0.7 }
      };

      const requestId = sendAiRequest(mockBridge, request);

      expect(requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.AI_REQUEST,
        payload: {
          ...request,
          requestId
        }
      });
    });

    it('should preserve request options', () => {
      const request = {
        prompt: 'Test prompt',
        options: {
          temperature: 0.7,
          maxTokens: 1000,
          model: 'test-model'
        }
      };

      const requestId = sendAiRequest(mockBridge, request);

      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.AI_REQUEST,
        payload: {
          ...request,
          requestId
        }
      });
    });
  });

  describe('cancelAiRequest', () => {
    it('should send cancel message with request ID', () => {
      const requestId = 'test-request';
      
      cancelAiRequest(mockBridge, requestId);

      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.CANCEL_REQUEST,
        payload: { requestId }
      });
    });
  });

  describe('requestAiStatus', () => {
    it('should send status request message', () => {
      requestAiStatus(mockBridge);

      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.GET_AI_STATUS
      });
    });
  });

  describe('sendResetMessage', () => {
    it('should send reset message', () => {
      sendResetMessage(mockBridge);

      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.RESET_AI
      });
    });
  });
}); 
 