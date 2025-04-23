import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAiHandler } from '../openai';
import { ApiHandlerOptions } from '../../../shared/types/api.types';
import { createChatMessage } from '../../../shared/types/chat.types';
import OpenAI from 'openai';

// Mock del client OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    })),
    AzureOpenAI: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

describe('OpenAiHandler', () => {
  let handler: OpenAiHandler;
  const mockOptions: ApiHandlerOptions = {
    openAiApiKey: 'test-key',
    openAiModelId: 'gpt-4',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an OpenAI client with standard options', () => {
      handler = new OpenAiHandler(mockOptions);
      expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: 'test-key',
      }));
    });

    it('should throw error if required options are missing', () => {
      expect(() => new OpenAiHandler({
        openAiModelId: 'gpt-4',
      } as ApiHandlerOptions)).toThrow();
    });
  });

  describe('fetchAPIResponse', () => {
    beforeEach(() => {
      handler = new OpenAiHandler(mockOptions);
    });

    it('should prepare and send messages correctly', async () => {
      const systemPrompt = 'You are a helpful assistant';
      const messages = [
        createChatMessage({ role: 'user', content: 'Hello', timestamp: Date.now() })
      ];

      await handler['fetchAPIResponse'](systemPrompt, messages);

      const mockClient = OpenAI as unknown as jest.Mock;
      const mockCreate = mockClient.mock.results[0].value.chat.completions.create;

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: systemPrompt }),
          expect.objectContaining({ role: 'user', content: 'Hello' })
        ]),
        stream: true,
      }));
    });

    it('should handle API errors correctly', async () => {
      const mockClient = OpenAI as unknown as jest.Mock;
      const mockCreate = mockClient.mock.results[0].value.chat.completions.create;
      mockCreate.mockRejectedValue(new OpenAI.APIError(429, { message: 'Rate limit exceeded' }, 'Rate limit', {}));

      await expect(handler['fetchAPIResponse']('test', [])).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('getModel', () => {
    it('should return correct model information', () => {
      handler = new OpenAiHandler(mockOptions);
      const model = handler.getModel();
      
      expect(model).toEqual({
        id: 'gpt-4',
        info: expect.any(Object)
      });
    });
  });
}); 