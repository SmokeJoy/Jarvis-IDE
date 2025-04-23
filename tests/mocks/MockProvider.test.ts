import { vi } from 'vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockProvider } from '../../src/providers/mock/MockProvider';
import { ApiError, ApiStreamTextChunk, ApiStreamUsageChunk } from '../../src/shared/types/api.types';
import { LLMMessage } from '../../src/shared/types/llm.types';

describe('MockProvider', () => {
  let provider: MockProvider;
  const validApiKey = 'valid-api-key';
  const mockMessages: LLMMessage[] = [
    { role: 'user', content: 'Hello' }
  ];

  beforeEach(() => {
    provider = new MockProvider({
      apiKey: validApiKey,
      mockDelay: 100,
      mockStreamDelay: 50
    });
  });

  describe('createChatCompletion', () => {
    it('should return a valid response with valid API key', async () => {
      const response = await provider.createChatCompletion(mockMessages);
      expect(response.content).toBeDefined();
      expect(response.usage).toBeDefined();
      expect(response.usage.totalTokens).toBeGreaterThan(0);
    });

    it('should throw ApiError with invalid API key', async () => {
      provider = new MockProvider({ apiKey: 'invalid-key' });
      await expect(provider.createChatCompletion(mockMessages))
        .rejects.toThrow(ApiError);
    });

    it('should handle temporary failures and retry successfully', async () => {
      let attempts = 0;
      const originalCreate = provider.createChatCompletion.bind(provider);
      
      provider.createChatCompletion = vi.fn().mockImplementation(async (messages) => {
        attempts++;
        if (attempts === 1) {
          throw new ApiError('Temporary failure', 500);
        }
        return originalCreate(messages);
      });

      const response = await provider.createChatCompletion(mockMessages);
      expect(attempts).toBe(2);
      expect(response.content).toBeDefined();
    });

    it('should handle network errors', async () => {
      provider.createChatCompletion = vi.fn().mockRejectedValue(
        new ApiError('Network error', 503)
      );

      await expect(provider.createChatCompletion(mockMessages))
        .rejects.toThrow(ApiError);
    });

    it('should handle rate limit errors', async () => {
      provider.createChatCompletion = vi.fn().mockRejectedValue(
        new ApiError('Rate limit exceeded', 429)
      );

      await expect(provider.createChatCompletion(mockMessages))
        .rejects.toThrow(ApiError);
    });
  });

  describe('createStreamingChatCompletion', () => {
    it('should stream chunks correctly', async () => {
      const chunks: (ApiStreamTextChunk | ApiStreamUsageChunk)[] = [];
      
      for await (const chunk of provider.createStreamingChatCompletion(mockMessages)) {
        chunks.push(chunk);
      }

      const textChunks = chunks.filter((c): c is ApiStreamTextChunk => 'content' in c);
      const usageChunks = chunks.filter((c): c is ApiStreamUsageChunk => 'usage' in c);

      expect(textChunks.length).toBeGreaterThan(0);
      expect(usageChunks.length).toBe(1);
      expect(usageChunks[0].usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle errors during streaming', async () => {
      provider = new MockProvider({ apiKey: 'invalid-key' });
      
      await expect(async () => {
        for await (const _ of provider.createStreamingChatCompletion(mockMessages)) {
          // Consume stream
        }
      }).rejects.toThrow(ApiError);
    });
  });

  describe('configuration', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        apiKey: 'new-api-key',
        mockDelay: 200,
        mockStreamDelay: 100
      };

      provider.updateConfig(newConfig);
      expect(provider.getConfig()).toEqual(newConfig);
    });

    it('should apply new settings in subsequent calls', async () => {
      const startTime = Date.now();
      await provider.createChatCompletion(mockMessages);
      const firstCallDuration = Date.now() - startTime;

      provider.updateConfig({ mockDelay: 300 });
      
      const newStartTime = Date.now();
      await provider.createChatCompletion(mockMessages);
      const secondCallDuration = Date.now() - newStartTime;

      expect(secondCallDuration).toBeGreaterThan(firstCallDuration);
    });
  });

  describe('call counting', () => {
    it('should track number of calls correctly', async () => {
      const initialCount = provider.getTotalCalls();
      
      await provider.createChatCompletion(mockMessages);
      expect(provider.getTotalCalls()).toBe(initialCount + 1);

      await provider.createChatCompletion(mockMessages);
      expect(provider.getTotalCalls()).toBe(initialCount + 2);
    });

    it('should count streaming calls', async () => {
      const initialCount = provider.getTotalCalls();
      
      for await (const _ of provider.createStreamingChatCompletion(mockMessages)) {
        // Consume stream
      }
      
      expect(provider.getTotalCalls()).toBe(initialCount + 1);
    });

    it('should count failed calls', async () => {
      const initialCount = provider.getTotalCalls();
      
      provider = new MockProvider({ apiKey: 'invalid-key' });
      
      try {
        await provider.createChatCompletion(mockMessages);
      } catch {
        // Expected error
      }

      expect(provider.getTotalCalls()).toBe(initialCount + 1);
    });
  });
}); 