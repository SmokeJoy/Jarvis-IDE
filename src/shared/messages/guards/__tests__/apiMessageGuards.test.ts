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
  isAnyApiMessage
} from '../apiMessageGuards';

describe('API Message Type Guards', () => {
  const baseMessage = {
    type: 'test',
    requestId: '123',
    timestamp: Date.now()
  };

  describe('isApiMessage', () => {
    it('should validate a well-formed base message', () => {
      expect(isApiMessage(baseMessage)).toBe(true);
    });

    it('should reject null/undefined values', () => {
      expect(isApiMessage(null)).toBe(false);
      expect(isApiMessage(undefined)).toBe(false);
    });

    it('should reject malformed messages', () => {
      expect(isApiMessage({ ...baseMessage, type: 123 })).toBe(false);
      expect(isApiMessage({ ...baseMessage, requestId: 123 })).toBe(false);
      expect(isApiMessage({ ...baseMessage, timestamp: '123' })).toBe(false);
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

    it('should reject invalid HTTP methods', () => {
      expect(isHttpMethod('INVALID')).toBe(false);
      expect(isHttpMethod('get')).toBe(false);
    });
  });

  describe('isApiRequestMessage', () => {
    const validRequest = {
      ...baseMessage,
      type: 'request',
      endpoint: '/api/test',
      method: 'GET',
      data: { test: true },
      headers: { 'Content-Type': 'application/json' }
    };

    it('should validate a well-formed request message', () => {
      expect(isApiRequestMessage(validRequest)).toBe(true);
    });

    it('should validate request without optional fields', () => {
      const minimalRequest = {
        ...baseMessage,
        type: 'request',
        endpoint: '/api/test',
        method: 'GET'
      };
      expect(isApiRequestMessage(minimalRequest)).toBe(true);
    });

    it('should reject malformed request messages', () => {
      expect(isApiRequestMessage({ ...validRequest, endpoint: 123 })).toBe(false);
      expect(isApiRequestMessage({ ...validRequest, method: 'INVALID' })).toBe(false);
    });
  });

  describe('isApiResponseMessage', () => {
    const validResponse = {
      ...baseMessage,
      type: 'response',
      status: 200,
      data: { success: true },
      headers: { 'Content-Type': 'application/json' }
    };

    it('should validate a well-formed response message', () => {
      expect(isApiResponseMessage(validResponse)).toBe(true);
    });

    it('should validate response without optional fields', () => {
      const { headers, ...minimalResponse } = validResponse;
      expect(isApiResponseMessage(minimalResponse)).toBe(true);
    });

    it('should reject malformed response messages', () => {
      expect(isApiResponseMessage({ ...validResponse, status: '200' })).toBe(false);
      expect(isApiResponseMessage({ ...validResponse, data: undefined })).toBe(false);
    });
  });

  describe('isApiErrorMessage', () => {
    const validError = {
      ...baseMessage,
      type: 'error',
      error: 'Test error',
      code: 500,
      details: { reason: 'test failure' }
    };

    it('should validate a well-formed error message', () => {
      expect(isApiErrorMessage(validError)).toBe(true);
    });

    it('should validate error without optional fields', () => {
      const { details, ...minimalError } = validError;
      expect(isApiErrorMessage(minimalError)).toBe(true);
    });

    it('should reject malformed error messages', () => {
      expect(isApiErrorMessage({ ...validError, error: 123 })).toBe(false);
      expect(isApiErrorMessage({ ...validError, code: '500' })).toBe(false);
    });
  });

  describe('isApiStreamStartMessage', () => {
    const validStreamStart = {
      ...baseMessage,
      type: 'stream_start',
      streamId: 'stream123',
      metadata: { contentType: 'text/event-stream' }
    };

    it('should validate a well-formed stream start message', () => {
      expect(isApiStreamStartMessage(validStreamStart)).toBe(true);
    });

    it('should validate stream start without optional fields', () => {
      const { metadata, ...minimalStreamStart } = validStreamStart;
      expect(isApiStreamStartMessage(minimalStreamStart)).toBe(true);
    });

    it('should reject malformed stream start messages', () => {
      expect(isApiStreamStartMessage({ ...validStreamStart, streamId: 123 })).toBe(false);
      expect(isApiStreamStartMessage({ ...validStreamStart, metadata: 'invalid' })).toBe(false);
    });
  });

  describe('isApiStreamDataMessage', () => {
    const validStreamData = {
      ...baseMessage,
      type: 'stream_data',
      streamId: 'stream123',
      data: 'chunk data',
      sequence: 1
    };

    it('should validate a well-formed stream data message', () => {
      expect(isApiStreamDataMessage(validStreamData)).toBe(true);
    });

    it('should validate stream data without optional fields', () => {
      const { sequence, ...minimalStreamData } = validStreamData;
      expect(isApiStreamDataMessage(minimalStreamData)).toBe(true);
    });

    it('should reject malformed stream data messages', () => {
      expect(isApiStreamDataMessage({ ...validStreamData, streamId: 123 })).toBe(false);
      expect(isApiStreamDataMessage({ ...validStreamData, data: undefined })).toBe(false);
      expect(isApiStreamDataMessage({ ...validStreamData, sequence: '1' })).toBe(false);
    });
  });

  describe('isApiStreamEndMessage', () => {
    const validStreamEnd = {
      ...baseMessage,
      type: 'stream_end',
      streamId: 'stream123',
      finalMetadata: { totalChunks: 10 }
    };

    it('should validate a well-formed stream end message', () => {
      expect(isApiStreamEndMessage(validStreamEnd)).toBe(true);
    });

    it('should validate stream end without optional fields', () => {
      const { finalMetadata, ...minimalStreamEnd } = validStreamEnd;
      expect(isApiStreamEndMessage(minimalStreamEnd)).toBe(true);
    });

    it('should reject malformed stream end messages', () => {
      expect(isApiStreamEndMessage({ ...validStreamEnd, streamId: 123 })).toBe(false);
      expect(isApiStreamEndMessage({ ...validStreamEnd, finalMetadata: 'invalid' })).toBe(false);
    });
  });

  describe('isAnyApiMessage', () => {
    it('should validate any valid API message type', () => {
      const validMessages = [
        {
          ...baseMessage,
          type: 'request',
          endpoint: '/test',
          method: 'GET'
        },
        {
          ...baseMessage,
          type: 'response',
          status: 200,
          data: {}
        },
        {
          ...baseMessage,
          type: 'error',
          error: 'Test error',
          code: 500
        },
        {
          ...baseMessage,
          type: 'stream_start',
          streamId: 'stream123'
        },
        {
          ...baseMessage,
          type: 'stream_data',
          streamId: 'stream123',
          data: 'test'
        },
        {
          ...baseMessage,
          type: 'stream_end',
          streamId: 'stream123'
        }
      ];

      validMessages.forEach(msg => {
        expect(isAnyApiMessage(msg)).toBe(true);
      });
    });

    it('should reject invalid message types', () => {
      expect(isAnyApiMessage({ ...baseMessage, type: 'invalid' })).toBe(false);
      expect(isAnyApiMessage(null)).toBe(false);
      expect(isAnyApiMessage(undefined)).toBe(false);
      expect(isAnyApiMessage({})).toBe(false);
    });
  });
}); 