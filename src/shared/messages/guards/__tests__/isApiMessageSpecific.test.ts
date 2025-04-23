import { describe, it, expect } from 'vitest';
import {
  isApiMessage,
  isApiRequestMessage,
  isApiResponseMessage,
  isApiErrorMessage,
  isApiStreamStartMessage,
  isApiStreamDataMessage,
  isApiStreamEndMessage,
  isAnyApiMessage
} from '../isApiMessageSpecific';

describe('API Message Type Guards', () => {
  const baseMessage = {
    type: 'test',
    requestId: '123',
    timestamp: Date.now()
  };

  describe('isApiMessage', () => {
    it('should return true for valid API messages', () => {
      expect(isApiMessage(baseMessage)).toBe(true);
    });

    it('should return false for invalid messages', () => {
      expect(isApiMessage(null)).toBe(false);
      expect(isApiMessage(undefined)).toBe(false);
      expect(isApiMessage({})).toBe(false);
      expect(isApiMessage({ type: 'test' })).toBe(false);
    });
  });

  describe('isApiRequestMessage', () => {
    const validRequest = {
      ...baseMessage,
      type: 'request',
      endpoint: '/api/test',
      method: 'GET'
    };

    it('should return true for valid request messages', () => {
      expect(isApiRequestMessage(validRequest)).toBe(true);
    });

    it('should return false for invalid request messages', () => {
      expect(isApiRequestMessage({ ...validRequest, method: 'INVALID' })).toBe(false);
      expect(isApiRequestMessage({ ...validRequest, endpoint: undefined })).toBe(false);
    });
  });

  describe('isApiResponseMessage', () => {
    const validResponse = {
      ...baseMessage,
      type: 'response',
      data: { test: true },
      status: 200
    };

    it('should return true for valid response messages', () => {
      expect(isApiResponseMessage(validResponse)).toBe(true);
    });

    it('should return false for invalid response messages', () => {
      expect(isApiResponseMessage({ ...validResponse, status: '200' })).toBe(false);
      expect(isApiResponseMessage({ ...validResponse, data: undefined })).toBe(false);
    });
  });

  describe('isApiErrorMessage', () => {
    const validError = {
      ...baseMessage,
      type: 'error',
      error: 'Test error',
      code: 404
    };

    it('should return true for valid error messages', () => {
      expect(isApiErrorMessage(validError)).toBe(true);
    });

    it('should return false for invalid error messages', () => {
      expect(isApiErrorMessage({ ...validError, code: '404' })).toBe(false);
      expect(isApiErrorMessage({ ...validError, error: undefined })).toBe(false);
    });
  });

  describe('isApiStreamStartMessage', () => {
    const validStreamStart = {
      ...baseMessage,
      type: 'stream_start',
      streamId: 'stream123'
    };

    it('should return true for valid stream start messages', () => {
      expect(isApiStreamStartMessage(validStreamStart)).toBe(true);
    });

    it('should return false for invalid stream start messages', () => {
      expect(isApiStreamStartMessage({ ...validStreamStart, streamId: undefined })).toBe(false);
    });
  });

  describe('isApiStreamDataMessage', () => {
    const validStreamData = {
      ...baseMessage,
      type: 'stream_data',
      streamId: 'stream123',
      data: { chunk: 'test' }
    };

    it('should return true for valid stream data messages', () => {
      expect(isApiStreamDataMessage(validStreamData)).toBe(true);
    });

    it('should return false for invalid stream data messages', () => {
      expect(isApiStreamDataMessage({ ...validStreamData, streamId: undefined })).toBe(false);
      expect(isApiStreamDataMessage({ ...validStreamData, data: undefined })).toBe(false);
    });
  });

  describe('isApiStreamEndMessage', () => {
    const validStreamEnd = {
      ...baseMessage,
      type: 'stream_end',
      streamId: 'stream123'
    };

    it('should return true for valid stream end messages', () => {
      expect(isApiStreamEndMessage(validStreamEnd)).toBe(true);
    });

    it('should return false for invalid stream end messages', () => {
      expect(isApiStreamEndMessage({ ...validStreamEnd, streamId: undefined })).toBe(false);
    });
  });

  describe('isAnyApiMessage', () => {
    it('should return true for any valid API message type', () => {
      const messages = [
        {
          ...baseMessage,
          type: 'request',
          endpoint: '/api/test',
          method: 'GET'
        },
        {
          ...baseMessage,
          type: 'response',
          data: { test: true },
          status: 200
        },
        {
          ...baseMessage,
          type: 'error',
          error: 'Test error',
          code: 404
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
          data: { chunk: 'test' }
        },
        {
          ...baseMessage,
          type: 'stream_end',
          streamId: 'stream123'
        }
      ];

      messages.forEach(msg => {
        expect(isAnyApiMessage(msg)).toBe(true);
      });
    });

    it('should return false for invalid messages', () => {
      expect(isAnyApiMessage(null)).toBe(false);
      expect(isAnyApiMessage(undefined)).toBe(false);
      expect(isAnyApiMessage({})).toBe(false);
      expect(isAnyApiMessage({ type: 'invalid' })).toBe(false);
    });
  });
}); 