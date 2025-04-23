import { z } from 'zod';
import { describe, it, expect } from 'vitest';
import {
  isApiMessage,
  isHttpMethod,
  isApiRequestMessage,
  isApiResponseMessage,
  isApiErrorMessage,
  isApiStreamStartMessage,
  isApiStreamDataMessage,
  isApiStreamEndMessage,
  isAnyApiMessage,
} from '../apiMessageGuards';

const baseMessage = {
  requestId: 'test-123',
  timestamp: Date.now(),
};

describe('API Message Type Guards', () => {
  describe('isApiMessage', () => {
    it('should validate well-formed base messages', () => {
      expect(isApiMessage({ ...baseMessage, type: 'test' })).toBe(true);
    });

    it('should reject null/undefined values', () => {
      expect(isApiMessage(null)).toBe(false);
      expect(isApiMessage(undefined)).toBe(false);
    });

    it('should reject malformed messages', () => {
      expect(isApiMessage({ type: 'test' })).toBe(false);
      expect(isApiMessage({ ...baseMessage })).toBe(false);
      expect(isApiMessage({ ...baseMessage, type: 123 })).toBe(false);
    });
  });

  describe('isHttpMethod', () => {
    it('should validate valid HTTP methods', () => {
      expect(isHttpMethod('GET')).toBe(true);
      expect(isHttpMethod('POST')).toBe(true);
      expect(isHttpMethod('PUT')).toBe(true);
      expect(isHttpMethod('DELETE')).toBe(true);
      expect(isHttpMethod('PATCH')).toBe(true);
    });

    it('should reject invalid methods', () => {
      expect(isHttpMethod('INVALID')).toBe(false);
      expect(isHttpMethod('')).toBe(false);
      expect(isHttpMethod(123 as any)).toBe(false);
    });
  });

  describe('isApiRequestMessage', () => {
    const validRequest = {
      ...baseMessage,
      type: 'request',
      endpoint: '/api/test',
      method: 'GET',
    };

    it('should validate well-formed requests', () => {
      expect(isApiRequestMessage(validRequest)).toBe(true);
      expect(
        isApiRequestMessage({
          ...validRequest,
          headers: { 'Content-Type': 'application/json' },
          body: { test: true },
        })
      ).toBe(true);
    });

    it('should validate requests without optional fields', () => {
      expect(isApiRequestMessage(validRequest)).toBe(true);
    });

    it('should reject malformed requests', () => {
      expect(isApiRequestMessage({ ...validRequest, method: 'INVALID' })).toBe(false);
      expect(isApiRequestMessage({ ...validRequest, endpoint: 123 })).toBe(false);
      expect(isApiRequestMessage({ ...validRequest, headers: 'invalid' })).toBe(false);
    });
  });

  describe('isApiResponseMessage', () => {
    const validResponse = {
      ...baseMessage,
      type: 'response',
      status: 200,
      data: { success: true },
    };

    it('should validate well-formed responses', () => {
      expect(isApiResponseMessage(validResponse)).toBe(true);
      expect(
        isApiResponseMessage({
          ...validResponse,
          headers: { 'Content-Type': 'application/json' },
        })
      ).toBe(true);
    });

    it('should validate responses without optional fields', () => {
      expect(isApiResponseMessage(validResponse)).toBe(true);
    });

    it('should reject malformed responses', () => {
      expect(isApiResponseMessage({ ...validResponse, status: '200' })).toBe(false);
      expect(isApiResponseMessage({ ...validResponse, headers: 'invalid' })).toBe(false);
      expect(isApiResponseMessage({ ...validResponse, data: undefined })).toBe(false);
    });
  });

  describe('isApiErrorMessage', () => {
    const validError = {
      ...baseMessage,
      type: 'error',
      error: 'Test error',
      code: 500,
    };

    it('should validate well-formed errors', () => {
      expect(isApiErrorMessage(validError)).toBe(true);
      expect(
        isApiErrorMessage({
          ...validError,
          details: { reason: 'test failure' },
        })
      ).toBe(true);
    });

    it('should validate errors without optional fields', () => {
      expect(isApiErrorMessage(validError)).toBe(true);
    });

    it('should reject malformed errors', () => {
      expect(isApiErrorMessage({ ...validError, error: 123 })).toBe(false);
      expect(isApiErrorMessage({ ...validError, code: '500' })).toBe(false);
      expect(isApiErrorMessage({ ...validError, details: 'invalid' })).toBe(false);
    });
  });

  describe('Streaming Messages', () => {
    const baseStreamMessage = {
      ...baseMessage,
      streamId: 'stream-123',
    };

    describe('isApiStreamStartMessage', () => {
      const validStreamStart = {
        ...baseStreamMessage,
        type: 'stream_start',
      };

      it('should validate well-formed stream start messages', () => {
        expect(isApiStreamStartMessage(validStreamStart)).toBe(true);
        expect(
          isApiStreamStartMessage({
            ...validStreamStart,
            metadata: { format: 'json' },
          })
        ).toBe(true);
      });

      it('should reject malformed stream start messages', () => {
        expect(isApiStreamStartMessage({ ...validStreamStart, streamId: 123 })).toBe(false);
        expect(isApiStreamStartMessage({ ...validStreamStart, metadata: 'invalid' })).toBe(false);
      });
    });

    describe('isApiStreamDataMessage', () => {
      const validStreamData = {
        ...baseStreamMessage,
        type: 'stream_data',
        data: 'chunk',
      };

      it('should validate well-formed stream data messages', () => {
        expect(isApiStreamDataMessage(validStreamData)).toBe(true);
        expect(
          isApiStreamDataMessage({
            ...validStreamData,
            sequence: 1,
          })
        ).toBe(true);
      });

      it('should reject malformed stream data messages', () => {
        expect(isApiStreamDataMessage({ ...validStreamData, data: undefined })).toBe(false);
        expect(isApiStreamDataMessage({ ...validStreamData, sequence: '1' })).toBe(false);
      });
    });

    describe('isApiStreamEndMessage', () => {
      const validStreamEnd = {
        ...baseStreamMessage,
        type: 'stream_end',
      };

      it('should validate well-formed stream end messages', () => {
        expect(isApiStreamEndMessage(validStreamEnd)).toBe(true);
        expect(
          isApiStreamEndMessage({
            ...validStreamEnd,
            finalMetadata: { totalChunks: 10 },
          })
        ).toBe(true);
      });

      it('should reject malformed stream end messages', () => {
        expect(isApiStreamEndMessage({ ...validStreamEnd, streamId: 123 })).toBe(false);
        expect(isApiStreamEndMessage({ ...validStreamEnd, finalMetadata: 'invalid' })).toBe(false);
      });
    });
  });

  describe('isAnyApiMessage', () => {
    it('should validate all valid API message types', () => {
      const messages = [
        {
          ...baseMessage,
          type: 'request',
          endpoint: '/test',
          method: 'GET',
        },
        {
          ...baseMessage,
          type: 'response',
          status: 200,
          data: null,
        },
        {
          ...baseMessage,
          type: 'error',
          error: 'Test error',
          code: 500,
        },
        {
          ...baseMessage,
          type: 'stream_start',
          streamId: 'test-stream',
        },
        {
          ...baseMessage,
          type: 'stream_data',
          streamId: 'test-stream',
          data: 'chunk',
        },
        {
          ...baseMessage,
          type: 'stream_end',
          streamId: 'test-stream',
        },
      ];

      messages.forEach((msg) => {
        expect(isAnyApiMessage(msg)).toBe(true);
      });
    });

    it('should reject invalid message types', () => {
      expect(isAnyApiMessage({ ...baseMessage, type: 'invalid' })).toBe(false);
      expect(isAnyApiMessage(null)).toBe(false);
      expect(isAnyApiMessage(undefined)).toBe(false);
    });
  });
}); 