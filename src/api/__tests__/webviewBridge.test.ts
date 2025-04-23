import { vi } from 'vitest';
import { z } from 'zod';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebviewBridge } from '../webviewBridge';
import { WebviewMessageType } from '@shared/types/webview.types';
import { ApiMessageType } from '@shared/messages/api-messages';

// Mock vscode module
vi.mock('vscode', () => ({
  Webview: class {}
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  Logger: class {
    debug = vi.fn();
    error = vi.fn();
  }
}));

describe('WebviewBridge', () => {
  let bridge: WebviewBridge;
  let mockWebview: { postMessage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    bridge = WebviewBridge.getInstance();
    mockWebview = { postMessage: vi.fn() };
    bridge.setWebview(mockWebview as any);
  });

  afterEach(() => {
    bridge.dispose();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = WebviewBridge.getInstance();
      const instance2 = WebviewBridge.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('message handlers', () => {
    it('should register and execute message handlers', () => {
      const handler = vi.fn();
      const message = { type: 'test', payload: { data: 'test' } };

      bridge.on('test', handler);
      bridge.handleMessage(message);

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle multiple handlers for the same message type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const message = { type: 'test', payload: { data: 'test' } };

      bridge.on('test', handler1);
      bridge.on('test', handler2);
      bridge.handleMessage(message);

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });

    it('should remove message handlers correctly', () => {
      const handler = vi.fn();
      const message = { type: 'test', payload: { data: 'test' } };

      bridge.on('test', handler);
      bridge.off('test', handler);
      bridge.handleMessage(message);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle invalid messages gracefully', () => {
      const handler = vi.fn();
      bridge.on('test', handler);

      bridge.handleMessage(null);
      bridge.handleMessage({});
      bridge.handleMessage({ payload: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('postMessage', () => {
    it('should send messages with correct format', () => {
      const type = WebviewMessageType.API_MESSAGE;
      const payload = { data: 'test' };

      bridge.postMessage(type, payload);

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type,
        payload
      });
    });

    it('should handle missing webview gracefully', () => {
      bridge.setWebview(null);
      bridge.postMessage(WebviewMessageType.API_MESSAGE, { data: 'test' });
      expect(mockWebview.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('postApiMessage', () => {
    it('should send API messages correctly', () => {
      const apiMessage = {
        type: ApiMessageType.NAVIGATE,
        payload: { route: '/test' }
      };

      bridge.postApiMessage(apiMessage);

      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: WebviewMessageType.API_MESSAGE,
        payload: apiMessage
      });
    });
  });

  describe('dispose', () => {
    it('should clear webview and handlers', () => {
      const handler = vi.fn();
      bridge.on('test', handler);

      bridge.dispose();

      bridge.handleMessage({ type: 'test' });
      expect(handler).not.toHaveBeenCalled();

      bridge.postMessage(WebviewMessageType.API_MESSAGE);
      expect(mockWebview.postMessage).not.toHaveBeenCalled();
    });
  });
}); 