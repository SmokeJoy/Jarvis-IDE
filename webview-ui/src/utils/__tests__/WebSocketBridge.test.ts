import { vi } from 'vitest';
/**
 * @file WebSocketBridge.test.ts
 * @description Test suite per il WebSocketBridge che segue le linee guida MAS
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WebSocketBridge from '../WebSocketBridge';
import { WebSocketMessageType } from '@shared/types/websocket.types';
import type { WebSocketMessageUnion } from '@shared/types/websocket.types';

// Mock del logger
vi.mock('@shared/utils/outputLogger', () => ({
  default: {
    createComponentLogger: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    })
  }
}));

// Mock dell'API vscode
vi.mock('../vscode', () => ({
  vscode: {
    postMessage: vi.fn()
  }
}));

// Import il mock dopo averlo definito
import { vscode } from '../vscode';

describe('WebSocketBridge', () => {
  let bridge: WebSocketBridge;

  beforeEach(() => {
    vi.useFakeTimers();
    bridge = WebSocketBridge.getInstance();
    vi.mocked(vscode.postMessage).mockClear();
  });

  afterEach(() => {
    bridge.dispose();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should create only one instance', () => {
      const instance1 = WebSocketBridge.getInstance();
      const instance2 = WebSocketBridge.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after dispose', () => {
      const instance1 = WebSocketBridge.getInstance();
      instance1.dispose();
      const instance2 = WebSocketBridge.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Message Handling', () => {
    it('should handle ping message correctly', () => {
      const pingMessage: WebSocketMessageUnion = {
        type: WebSocketMessageType.PING,
        timestamp: Date.now()
      };

      // Simula ricezione messaggio ping
      window.dispatchEvent(new MessageEvent('message', { 
        data: pingMessage 
      }));

      // Verifica che sia stata inviata risposta pong
      expect(vscode.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: WebSocketMessageType.PONG,
        timestamp: expect.any(Number)
      }));
    });

    it('should ignore invalid messages', () => {
      const invalidMessage = { foo: 'bar' };
      
      window.dispatchEvent(new MessageEvent('message', { 
        data: invalidMessage 
      }));

      expect(vscode.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('Listener Management', () => {
    it('should register and notify listeners', () => {
      const mockListener = vi.fn();
      const testMessage = { type: 'test', data: 'data' };

      bridge.on('test', mockListener);
      bridge['notifyListeners']('test', testMessage);

      expect(mockListener).toHaveBeenCalledWith(testMessage);
    });

    it('should remove specific listener', () => {
      const mockListener = vi.fn();
      const testMessage = { type: 'test', data: 'data' };

      const unsubscribe = bridge.on('test', mockListener);
      unsubscribe();
      bridge['notifyListeners']('test', testMessage);

      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should remove all listeners', () => {
      const mockListener1 = vi.fn();
      const mockListener2 = vi.fn();
      const testMessage = { type: 'test', data: 'data' };

      bridge.on('test', mockListener1);
      bridge.on('test', mockListener2);
      bridge.removeAllListeners();
      bridge['notifyListeners']('test', testMessage);

      expect(mockListener1).not.toHaveBeenCalled();
      expect(mockListener2).not.toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('should start ping interval on initialization', () => {
      vi.advanceTimersByTime(30000);
      
      expect(vscode.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: WebSocketMessageType.PING,
        timestamp: expect.any(Number)
      }));
    });

    it('should send disconnect message on dispose', () => {
      bridge.dispose();

      expect(vscode.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: WebSocketMessageType.DISCONNECT,
        reason: 'WebSocketBridge disposed',
        timestamp: expect.any(Number)
      }));
    });

    it('should clear ping interval on dispose', () => {
      bridge.dispose();
      vi.advanceTimersByTime(30000);
      
      const callCount = vi.mocked(vscode.postMessage).mock.calls.length;
      vi.advanceTimersByTime(30000);
      
      expect(vi.mocked(vscode.postMessage).mock.calls.length).toBe(callCount);
    });
  });

  describe('Message Sending', () => {
    it('should send messages via vscode.postMessage', () => {
      const testMessage: WebSocketMessageUnion = {
        type: WebSocketMessageType.PING,
        timestamp: Date.now()
      };

      bridge.sendMessage(testMessage);

      expect(vscode.postMessage).toHaveBeenCalledWith(testMessage);
    });

    it('should handle errors when sending messages', () => {
      const testMessage: WebSocketMessageUnion = {
        type: WebSocketMessageType.PING,
        timestamp: Date.now()
      };

      vi.mocked(vscode.postMessage).mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      expect(() => bridge.sendMessage(testMessage)).not.toThrow();
    });
  });
}); 