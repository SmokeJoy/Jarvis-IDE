import { vi } from 'vitest';
/**
 * @file handlers.test.ts
 * @description Test per gli handler dei messaggi del modulo ai-bridge
 * @author dev ai 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebviewBridge } from '@shared/utils/WebviewBridge';
import { ExtensionMessageType } from '@shared/messages';
import { aiBridgeStateManager } from '../state';
import { initializeMessageHandlers } from '../handlers';
import { INITIAL_STATE } from '../constants';

// Mock del WebviewBridge
vi.mock('@shared/utils/WebviewBridge', () => ({
  WebviewBridge: {
    on: vi.fn(),
    sendMessage: vi.fn()
  }
}));

// Mock del logger
vi.mock('@shared/utils/outputLogger', () => ({
  default: {
    createComponentLogger: () => ({
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

describe('AI Bridge Handlers', () => {
  const mockBridge = {
    on: vi.fn(),
    sendMessage: vi.fn()
  };

  const mockContext = {
    bridge: mockBridge,
    state: aiBridgeStateManager
  };

  beforeEach(() => {
    // Reset dei mock
    vi.clearAllMocks();
    // Reset dello stato
    aiBridgeStateManager.reset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initializeMessageHandlers', () => {
    it('should register all required message handlers', () => {
      initializeMessageHandlers(mockContext);

      expect(mockBridge.on).toHaveBeenCalledTimes(4);
      expect(mockBridge.on).toHaveBeenCalledWith('aiResponse', expect.any(Function));
      expect(mockBridge.on).toHaveBeenCalledWith('tokenUpdate', expect.any(Function));
      expect(mockBridge.on).toHaveBeenCalledWith('cancel', expect.any(Function));
      expect(mockBridge.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('handleAiResponseMessage', () => {
    beforeEach(() => {
      initializeMessageHandlers(mockContext);
      aiBridgeStateManager.setRequestId('test-request');
      aiBridgeStateManager.setStatus('pending');
    });

    it('should handle valid AI response', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'aiResponse')[1];
      
      handler({
        type: ExtensionMessageType.AI_RESPONSE,
        payload: {
          requestId: 'test-request',
          response: 'Test response'
        }
      });

      const state = aiBridgeStateManager.getState();
      expect(state.response).toBe('Test response');
      expect(state.status).toBe('done');
    });

    it('should ignore response with non-matching requestId', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'aiResponse')[1];
      
      handler({
        type: ExtensionMessageType.AI_RESPONSE,
        payload: {
          requestId: 'wrong-request',
          response: 'Test response'
        }
      });

      const state = aiBridgeStateManager.getState();
      expect(state.response).toBe(INITIAL_STATE.response);
      expect(state.status).toBe('pending');
    });

    it('should ignore invalid message format', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'aiResponse')[1];
      
      handler({
        type: 'invalid',
        payload: {}
      });

      const state = aiBridgeStateManager.getState();
      expect(state).toEqual({
        ...INITIAL_STATE,
        requestId: 'test-request',
        status: 'pending'
      });
    });
  });

  describe('handleTokenUpdateMessage', () => {
    beforeEach(() => {
      initializeMessageHandlers(mockContext);
      aiBridgeStateManager.setRequestId('test-request');
      aiBridgeStateManager.setStatus('pending');
    });

    it('should handle valid token update', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'tokenUpdate')[1];
      
      handler({
        type: ExtensionMessageType.TOKEN_UPDATE,
        payload: {
          requestId: 'test-request',
          tokens: 100
        }
      });

      const state = aiBridgeStateManager.getState();
      expect(state.tokens).toBe(100);
      expect(state.status).toBe('streaming');
    });

    it('should ignore update with non-matching requestId', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'tokenUpdate')[1];
      
      handler({
        type: ExtensionMessageType.TOKEN_UPDATE,
        payload: {
          requestId: 'wrong-request',
          tokens: 100
        }
      });

      const state = aiBridgeStateManager.getState();
      expect(state.tokens).toBe(INITIAL_STATE.tokens);
    });
  });

  describe('handleCancelMessage', () => {
    beforeEach(() => {
      initializeMessageHandlers(mockContext);
      aiBridgeStateManager.setRequestId('test-request');
      aiBridgeStateManager.setStatus('streaming');
    });

    it('should handle valid cancel message', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'cancel')[1];
      
      handler({
        type: ExtensionMessageType.CANCEL,
        payload: {
          requestId: 'test-request'
        }
      });

      const state = aiBridgeStateManager.getState();
      expect(state).toEqual(INITIAL_STATE);
    });

    it('should ignore cancel with non-matching requestId', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'cancel')[1];
      
      handler({
        type: ExtensionMessageType.CANCEL,
        payload: {
          requestId: 'wrong-request'
        }
      });

      const state = aiBridgeStateManager.getState();
      expect(state.status).toBe('streaming');
    });
  });

  describe('handleErrorMessage', () => {
    beforeEach(() => {
      initializeMessageHandlers(mockContext);
      aiBridgeStateManager.setRequestId('test-request');
      aiBridgeStateManager.setStatus('pending');
    });

    it('should handle error message with requestId', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'error')[1];
      
      handler({
        type: ExtensionMessageType.ERROR,
        payload: {
          requestId: 'test-request',
          error: 'Test error'
        }
      });

      const state = aiBridgeStateManager.getState();
      expect(state.error).toBe('Test error');
      expect(state.status).toBe('error');
    });

    it('should handle error message without requestId', () => {
      const handler = mockBridge.on.mock.calls.find(call => call[0] === 'error')[1];
      
      handler({
        type: ExtensionMessageType.ERROR,
        payload: {
          error: 'Global error'
        }
      });

      const state = aiBridgeStateManager.getState();
      expect(state.error).toBe('Global error');
      expect(state.status).toBe('error');
    });
  });
}); 
 