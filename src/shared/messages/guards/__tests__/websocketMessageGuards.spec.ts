import { describe, it, expect } from 'vitest';
import { WebSocketMessageType } from '../../../types/websocket.types';
import {
  isWebSocketMessage,
  isConnectMessage,
  isDisconnectMessage,
  isPingMessage,
  isPongMessage,
  isStatusMessage,
  isErrorMessage,
  isLLMStatusMessage,
  isLLMCancelMessage,
  isLLMStreamMessage,
  isResetMessage,
  isReloadMessage,
  isAnyWebSocketMessage
} from '../websocketMessageGuards';

describe('WebSocket Message Type Guards', () => {
  const baseMessage = {
    timestamp: Date.now()
  };

  describe('isWebSocketMessage', () => {
    it('should validate well-formed base message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.CONNECT
      };
      expect(isWebSocketMessage(msg)).toBe(true);
    });

    it('should reject null/undefined', () => {
      expect(isWebSocketMessage(null)).toBe(false);
      expect(isWebSocketMessage(undefined)).toBe(false);
    });

    it('should reject malformed messages', () => {
      expect(isWebSocketMessage({ type: 'invalid' })).toBe(false);
      expect(isWebSocketMessage({ timestamp: 'not-a-number' })).toBe(false);
      expect(isWebSocketMessage({})).toBe(false);
    });
  });

  describe('isConnectMessage', () => {
    it('should validate well-formed connect message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.CONNECT,
        clientId: 'test-client',
        version: '1.0.0'
      };
      expect(isConnectMessage(msg)).toBe(true);
    });

    it('should reject malformed connect message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.CONNECT,
        clientId: 123, // wrong type
        version: '1.0.0'
      };
      expect(isConnectMessage(msg)).toBe(false);
    });
  });

  describe('isDisconnectMessage', () => {
    it('should validate disconnect message with reason', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.DISCONNECT,
        reason: 'client closed'
      };
      expect(isDisconnectMessage(msg)).toBe(true);
    });

    it('should validate disconnect message without reason', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.DISCONNECT
      };
      expect(isDisconnectMessage(msg)).toBe(true);
    });
  });

  describe('isPingMessage and isPongMessage', () => {
    it('should validate ping message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.PING
      };
      expect(isPingMessage(msg)).toBe(true);
    });

    it('should validate pong message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.PONG
      };
      expect(isPongMessage(msg)).toBe(true);
    });
  });

  describe('isStatusMessage', () => {
    it('should validate status message with details', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.STATUS,
        status: 'connected',
        details: 'connection established'
      };
      expect(isStatusMessage(msg)).toBe(true);
    });

    it('should validate status message without details', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.STATUS,
        status: 'disconnected'
      };
      expect(isStatusMessage(msg)).toBe(true);
    });

    it('should reject invalid status', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.STATUS,
        status: 'invalid-status'
      };
      expect(isStatusMessage(msg)).toBe(false);
    });
  });

  describe('isErrorMessage', () => {
    it('should validate error message with details', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.ERROR,
        error: 'connection failed',
        code: 1001,
        details: { reason: 'timeout' }
      };
      expect(isErrorMessage(msg)).toBe(true);
    });

    it('should validate error message without details', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.ERROR,
        error: 'unknown error',
        code: 1000
      };
      expect(isErrorMessage(msg)).toBe(true);
    });
  });

  describe('isLLMStatusMessage', () => {
    it('should validate LLM status message with error', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.LLM_STATUS,
        modelId: 'gpt-4',
        status: 'error',
        error: 'model not available'
      };
      expect(isLLMStatusMessage(msg)).toBe(true);
    });

    it('should validate LLM status message without error', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.LLM_STATUS,
        modelId: 'gpt-4',
        status: 'ready'
      };
      expect(isLLMStatusMessage(msg)).toBe(true);
    });
  });

  describe('isLLMCancelMessage', () => {
    it('should validate LLM cancel message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.LLM_CANCEL,
        requestId: 'req-123'
      };
      expect(isLLMCancelMessage(msg)).toBe(true);
    });
  });

  describe('isLLMStreamMessage', () => {
    it('should validate LLM stream message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.LLM_STREAM,
        requestId: 'req-123',
        chunk: 'Hello',
        done: false
      };
      expect(isLLMStreamMessage(msg)).toBe(true);
    });

    it('should reject malformed LLM stream message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.LLM_STREAM,
        requestId: 'req-123',
        chunk: 123, // wrong type
        done: false
      };
      expect(isLLMStreamMessage(msg)).toBe(false);
    });
  });

  describe('isResetMessage and isReloadMessage', () => {
    it('should validate reset message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.RESET
      };
      expect(isResetMessage(msg)).toBe(true);
    });

    it('should validate reload message', () => {
      const msg = {
        ...baseMessage,
        type: WebSocketMessageType.RELOAD
      };
      expect(isReloadMessage(msg)).toBe(true);
    });
  });

  describe('isAnyWebSocketMessage', () => {
    it('should validate all valid message types', () => {
      const messages = [
        {
          ...baseMessage,
          type: WebSocketMessageType.CONNECT,
          clientId: 'test',
          version: '1.0.0'
        },
        {
          ...baseMessage,
          type: WebSocketMessageType.DISCONNECT
        },
        {
          ...baseMessage,
          type: WebSocketMessageType.PING
        },
        {
          ...baseMessage,
          type: WebSocketMessageType.STATUS,
          status: 'connected'
        },
        {
          ...baseMessage,
          type: WebSocketMessageType.ERROR,
          error: 'test error',
          code: 1000
        },
        {
          ...baseMessage,
          type: WebSocketMessageType.RESET
        }
      ];

      messages.forEach(msg => {
        expect(isAnyWebSocketMessage(msg)).toBe(true);
      });
    });

    it('should reject invalid message types', () => {
      const invalidMessages = [
        null,
        undefined,
        {},
        { type: 'invalid' },
        { type: WebSocketMessageType.CONNECT }, // missing required fields
        {
          ...baseMessage,
          type: 'not-a-valid-type'
        }
      ];

      invalidMessages.forEach(msg => {
        expect(isAnyWebSocketMessage(msg)).toBe(false);
      });
    });
  });
}); 