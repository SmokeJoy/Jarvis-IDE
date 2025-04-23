import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webviewBridge } from '../WebviewBridge';
import type { ExtensionMessage, WebviewMessage } from '@shared/messages';
import {
  type ExtensionMessageUnion,
  type WebviewMessageUnion,
  WebSocketMessageType,
  AgentMessageType,
  ExtensionMessageType,
} from '@shared/messages';
import {
  WebSocketMessageUnionSchema,
  AgentMessageUnionSchema,
  ExtensionMessageUnionSchema
} from '@shared/schemas';
import type { PromptProfile } from '@shared/types/prompt';

describe('WebviewBridge', () => {
  let mockVSCodeApi: {
    postMessage: vi.Mock;
    getState: vi.Mock;
    setState: vi.Mock;
  };

  beforeEach(() => {
    // Mock dell'API VS Code
    mockVSCodeApi = {
      postMessage: vi.fn(),
      getState: vi.fn(),
      setState: vi.fn()
    };

    // Mock globale di acquireVsCodeApi
    (global as any).acquireVsCodeApi = vi.fn(() => mockVSCodeApi);

    // Reset dei moduli per ogni test
    vi.resetModules();
  });

  afterEach(() => {
    webviewBridge.dispose();
  });

  describe('Initialization', () => {
    it('should be a singleton', () => {
      const instance1 = webviewBridge;
      const instance2 = webviewBridge;
      expect(instance1).toBe(instance2);
    });

    it('should initialize VS Code API', () => {
      expect((global as any).acquireVsCodeApi).toHaveBeenCalled();
    });

    it('should handle VS Code API acquisition failure', () => {
      (global as any).acquireVsCodeApi = vi.fn(() => {
        throw new Error('API not available');
      });

      expect(() => {
        // Forza una nuova istanza
        webviewBridge.dispose();
        const newInstance = webviewBridge;
        expect(newInstance).toBeDefined();
      }).toThrow('API not available');
    });
  });

  describe('Message Sending', () => {
    it('should send valid messages (WebSocket example)', () => {
      const message: WebviewMessageUnion = {
        type: WebSocketMessageType.WEBSOCKET_CONNECT,
        payload: { url: 'ws://localhost:8080' }
      };
      expect(WebSocketMessageUnionSchema.safeParse(message).success).toBe(true);

      webviewBridge.sendMessage(message);
      expect(mockVSCodeApi.postMessage).toHaveBeenCalledWith(message);
    });

    it('should normalize messages without payload (if valid)', () => {
      const message: WebviewMessageUnion = {
        type: WebSocketMessageType.PING
      };
      expect(WebSocketMessageUnionSchema.safeParse(message).success).toBe(true);

      webviewBridge.sendMessage(message);
      expect(mockVSCodeApi.postMessage).toHaveBeenCalledWith({
        type: WebSocketMessageType.PING,
        payload: {}
      });
    });

    it('should not send messages after dispose', () => {
      webviewBridge.dispose();
      const message: WebviewMessageUnion = {
        type: WebSocketMessageType.PONG,
        payload: { timestamp: Date.now() }
      };
      expect(WebSocketMessageUnionSchema.safeParse(message).success).toBe(true);

      webviewBridge.sendMessage(message);
      expect(mockVSCodeApi.postMessage).not.toHaveBeenCalled();
    });

    it('should throw on invalid message format', () => {
      const invalidMessage = { foo: 'bar' };
      expect(() => {
        webviewBridge.sendMessage(invalidMessage as any);
      }).toThrow('Formato messaggio non valido');
    });
  });

  describe('Message Receiving', () => {
    it('should invoke registered handlers for matching message type (Extension example)', () => {
      const handler = vi.fn();
      const validPayload: PromptProfile = { id: '1', name: 'Test Profile', contextPrompt: 'Test context', systemPrompt: 'Test system' };
      const message: ExtensionMessageUnion = {
        type: ExtensionMessageType.PROMPT_PROFILE_UPDATED,
        payload: { profile: validPayload }
      };
      expect(ExtensionMessageUnionSchema.safeParse(message).success).toBe(true);

      webviewBridge.on(ExtensionMessageType.PROMPT_PROFILE_UPDATED, handler);
      window.dispatchEvent(new MessageEvent('message', { data: message }));

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle multiple handlers for same type (Agent example)', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const message: ExtensionMessageUnion = {
        type: AgentMessageType.AGENT_TOGGLE_ENABLE,
        payload: { agentId: 'test-agent', enabled: true }
      };
      expect(AgentMessageUnionSchema.safeParse(message).success).toBe(true);

      webviewBridge.on(AgentMessageType.AGENT_TOGGLE_ENABLE, handler1);
      webviewBridge.on(AgentMessageType.AGENT_TOGGLE_ENABLE, handler2);
      window.dispatchEvent(new MessageEvent('message', { data: message }));

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });

    it('should not invoke handlers for non-matching types', () => {
      const handler = vi.fn();
      const message: ExtensionMessageUnion = {
        type: WebSocketMessageType.PONG,
        payload: { timestamp: Date.now() }
      };
      expect(WebSocketMessageUnionSchema.safeParse(message).success).toBe(true);

      webviewBridge.on(AgentMessageType.AGENT_TOGGLE_ENABLE, handler);
      window.dispatchEvent(new MessageEvent('message', { data: message }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle invalid message format received', () => {
      const handler = vi.fn();
      const invalidMessage = { foo: 'bar' };

      webviewBridge.on(WebSocketMessageType.PING, handler);
      window.dispatchEvent(new MessageEvent('message', { data: invalidMessage }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle errors in handlers', () => {
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      const message: ExtensionMessageUnion = {
        type: AgentMessageType.AGENT_TASK_COMPLETED,
        payload: { agentId: 'test-agent', taskId: 'task-123', result: 'Success' }
      };
      expect(AgentMessageUnionSchema.safeParse(message).success).toBe(true);

      webviewBridge.on(AgentMessageType.AGENT_TASK_COMPLETED, errorHandler);
      
      expect(() => {
        window.dispatchEvent(new MessageEvent('message', { data: message }));
      }).not.toThrow();

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Handler Management', () => {
    it('should allow handler removal', () => {
      const handler = vi.fn();
      const message: ExtensionMessageUnion = {
        type: WebSocketMessageType.PONG,
        payload: { timestamp: Date.now() }
      };
      expect(WebSocketMessageUnionSchema.safeParse(message).success).toBe(true);

      const unsubscribe = webviewBridge.on(WebSocketMessageType.PONG, handler);
      unsubscribe();

      window.dispatchEvent(new MessageEvent('message', { data: message }));
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple unsubscribes safely', () => {
      const handler = vi.fn();
      const unsubscribe = webviewBridge.on(WebSocketMessageType.PONG, handler);

      unsubscribe();
      unsubscribe();
    });

    it('should not register handlers after dispose', () => {
      webviewBridge.dispose();
      const handler = vi.fn();
      const unsubscribe = webviewBridge.on(WebSocketMessageType.PING, handler);

      const message: ExtensionMessageUnion = { type: WebSocketMessageType.PING };
      expect(WebSocketMessageUnionSchema.safeParse(message).success).toBe(true);
      window.dispatchEvent(new MessageEvent('message', { data: message }));

      expect(handler).not.toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should remove all handlers on dispose', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      webviewBridge.on(WebSocketMessageType.PING, handler1);
      webviewBridge.on(AgentMessageType.AGENT_TOGGLE_ENABLE, handler2);

      webviewBridge.dispose();

      const message1: ExtensionMessageUnion = { type: WebSocketMessageType.PING };
      expect(WebSocketMessageUnionSchema.safeParse(message1).success).toBe(true);
      window.dispatchEvent(new MessageEvent('message', { data: message1 }));

      const message2: ExtensionMessageUnion = { type: AgentMessageType.AGENT_TOGGLE_ENABLE, payload: { agentId: 'a1', enabled: false } };
      expect(AgentMessageUnionSchema.safeParse(message2).success).toBe(true);
      window.dispatchEvent(new MessageEvent('message', { data: message2 }));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on dispose', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      webviewBridge.dispose();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should clear all handlers on dispose', () => {
      const handler = vi.fn();
      const message: ExtensionMessageUnion = {
        type: WebSocketMessageType.PONG,
        payload: { timestamp: Date.now() }
      };

      webviewBridge.on(WebSocketMessageType.PONG, handler);
      webviewBridge.dispose();

      window.dispatchEvent(new MessageEvent('message', { data: message }));
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple dispose calls safely', () => {
      expect(() => {
        webviewBridge.dispose();
        webviewBridge.dispose();
      }).not.toThrow();
    });
  });

  describe('onAny / offAny', () => {
    it('should register a handler for any message', () => {
      const anyHandler = vi.fn();
      const unsubscribe = webviewBridge.onAny(anyHandler);

      const message1: ExtensionMessageUnion = { type: WebSocketMessageType.PONG, payload: { timestamp: Date.now() } };
      expect(WebSocketMessageUnionSchema.safeParse(message1).success).toBe(true);
      window.dispatchEvent(new MessageEvent('message', { data: message1 }));

      const message2: ExtensionMessageUnion = { type: AgentMessageType.AGENT_TOGGLE_ENABLE, payload: { agentId: 'a1', enabled: true } };
      expect(AgentMessageUnionSchema.safeParse(message2).success).toBe(true);
      window.dispatchEvent(new MessageEvent('message', { data: message2 }));

      expect(anyHandler).toHaveBeenCalledTimes(2);
      expect(anyHandler).toHaveBeenCalledWith(message1);
      expect(anyHandler).toHaveBeenCalledWith(message2);

      unsubscribe();
    });

    it('should remove the any handler with offAny', () => {
      const anyHandler = vi.fn();
      webviewBridge.onAny(anyHandler);
      webviewBridge.offAny(anyHandler);

      const message1: ExtensionMessageUnion = { type: WebSocketMessageType.PONG, payload: { timestamp: Date.now() } };
      expect(WebSocketMessageUnionSchema.safeParse(message1).success).toBe(true);
      window.dispatchEvent(new MessageEvent('message', { data: message1 }));

      expect(anyHandler).not.toHaveBeenCalled();
    });

    it('should remove the any handler via unsubscribe function', () => {
      const anyHandler = vi.fn();
      const unsubscribe = webviewBridge.onAny(anyHandler);
      unsubscribe();

      const message1: ExtensionMessageUnion = { type: WebSocketMessageType.PONG, payload: { timestamp: Date.now() } };
      expect(WebSocketMessageUnionSchema.safeParse(message1).success).toBe(true);
      window.dispatchEvent(new MessageEvent('message', { data: message1 }));

      expect(anyHandler).not.toHaveBeenCalled();
    });

    it('should remove all any handlers on dispose', () => {
      const anyHandler1 = vi.fn();
      const anyHandler2 = vi.fn();
      webviewBridge.onAny(anyHandler1);
      webviewBridge.onAny(anyHandler2);

      webviewBridge.dispose();

      const message1: ExtensionMessageUnion = { type: WebSocketMessageType.PONG, payload: { timestamp: Date.now() } };
      expect(WebSocketMessageUnionSchema.safeParse(message1).success).toBe(true);
      window.dispatchEvent(new MessageEvent('message', { data: message1 }));

      expect(anyHandler1).not.toHaveBeenCalled();
      expect(anyHandler2).not.toHaveBeenCalled();
    });
  });
}); 