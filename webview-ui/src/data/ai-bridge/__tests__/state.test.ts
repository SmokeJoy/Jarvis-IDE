import { vi } from 'vitest';
/**
 * @file state.test.ts
 * @description Test per lo state manager del modulo ai-bridge
 * @author dev ai 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiBridgeStateManager } from '../state';
import { INITIAL_STATE } from '../constants';
import type { AiBridgeState } from '../types';

// Mock del logger
vi.mock('@shared/utils/outputLogger', () => ({
  default: {
    createComponentLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn()
    })
  }
}));

describe('AI Bridge State Manager', () => {
  beforeEach(() => {
    // Reset dello stato prima di ogni test
    aiBridgeStateManager.reset();
  });

  describe('getState', () => {
    it('should return initial state after reset', () => {
      const state = aiBridgeStateManager.getState();
      expect(state).toEqual(INITIAL_STATE);
    });

    it('should return immutable state copy', () => {
      const state = aiBridgeStateManager.getState();
      const newState = aiBridgeStateManager.getState();
      expect(state).toEqual(newState);
      expect(state).not.toBe(newState);
    });
  });

  describe('setStatus', () => {
    it('should update status', () => {
      aiBridgeStateManager.setStatus('streaming');
      expect(aiBridgeStateManager.getState().status).toBe('streaming');
    });

    it('should notify subscribers of status change', () => {
      const listener = vi.fn();
      aiBridgeStateManager.subscribe(listener);
      
      aiBridgeStateManager.setStatus('streaming');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'streaming' })
      );
    });
  });

  describe('setResponse', () => {
    it('should update response', () => {
      const response = 'Test response';
      aiBridgeStateManager.setResponse(response);
      expect(aiBridgeStateManager.getState().response).toBe(response);
    });

    it('should notify subscribers of response change', () => {
      const listener = vi.fn();
      aiBridgeStateManager.subscribe(listener);
      
      aiBridgeStateManager.setResponse('Test response');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ response: 'Test response' })
      );
    });
  });

  describe('setError', () => {
    it('should update error and set status to error', () => {
      const error = 'Test error';
      aiBridgeStateManager.setError(error);
      
      const state = aiBridgeStateManager.getState();
      expect(state.error).toBe(error);
      expect(state.status).toBe('error');
    });

    it('should notify subscribers of error', () => {
      const listener = vi.fn();
      aiBridgeStateManager.subscribe(listener);
      
      aiBridgeStateManager.setError('Test error');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          status: 'error'
        })
      );
    });
  });

  describe('updateTokens', () => {
    it('should update token count', () => {
      aiBridgeStateManager.updateTokens(100);
      expect(aiBridgeStateManager.getState().tokens).toBe(100);
    });

    it('should notify subscribers of token update', () => {
      const listener = vi.fn();
      aiBridgeStateManager.subscribe(listener);
      
      aiBridgeStateManager.updateTokens(100);
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ tokens: 100 })
      );
    });
  });

  describe('setRequestId', () => {
    it('should update request ID', () => {
      const requestId = 'test-request';
      aiBridgeStateManager.setRequestId(requestId);
      expect(aiBridgeStateManager.getState().requestId).toBe(requestId);
    });

    it('should notify subscribers of request ID change', () => {
      const listener = vi.fn();
      aiBridgeStateManager.subscribe(listener);
      
      aiBridgeStateManager.setRequestId('test-request');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'test-request' })
      );
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      // Setup some state changes
      aiBridgeStateManager.setStatus('streaming');
      aiBridgeStateManager.setResponse('test');
      aiBridgeStateManager.setRequestId('test-id');
      aiBridgeStateManager.updateTokens(100);
      aiBridgeStateManager.setError('error');

      // Reset
      aiBridgeStateManager.reset();

      // Verify
      expect(aiBridgeStateManager.getState()).toEqual(INITIAL_STATE);
    });

    it('should notify subscribers of reset', () => {
      const listener = vi.fn();
      aiBridgeStateManager.subscribe(listener);
      
      aiBridgeStateManager.reset();
      
      expect(listener).toHaveBeenCalledWith(INITIAL_STATE);
    });
  });

  describe('subscription management', () => {
    it('should allow multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      aiBridgeStateManager.subscribe(listener1);
      aiBridgeStateManager.subscribe(listener2);
      
      aiBridgeStateManager.setStatus('streaming');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = aiBridgeStateManager.subscribe(listener);
      
      aiBridgeStateManager.setStatus('streaming');
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      aiBridgeStateManager.setStatus('done');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple state changes', () => {
      const listener = vi.fn();
      aiBridgeStateManager.subscribe(listener);
      
      aiBridgeStateManager.setStatus('pending');
      aiBridgeStateManager.setResponse('test');
      aiBridgeStateManager.updateTokens(100);
      
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });
}); 
 