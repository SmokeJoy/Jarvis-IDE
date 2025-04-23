import { vi } from 'vitest';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { JarvisAPI } from '../../src/shared/api/JarvisAPI';
import type { 
  ApiConfiguration,
  ApiHandlerOptions,
  ApiStreamTextChunk,
  ApiStreamUsageChunk,
  LLMProviderId
} from '../../src/shared/types/api.types';
import { MockProvider } from '../mocks/MockProvider';

describe('JarvisAPI E2E Tests', () => {
  let api: JarvisAPI;
  let mockProvider: MockProvider;

  beforeEach(() => {
    mockProvider = new MockProvider();
    const config: ApiConfiguration = {
      providerId: 'mock' as LLMProviderId,
      apiKey: 'test-key',
      baseUrl: 'http://localhost:3000',
      modelName: 'test-model',
      maxTokens: 1000,
      temperature: 0.7
    };

    const options: ApiHandlerOptions = {
      retryAttempts: 3,
      timeoutMs: 30000,
      rateLimitPerMinute: 60
    };

    api = new JarvisAPI(config, options);
    api.setProvider(mockProvider);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Chat Completion', () => {
    test('should handle basic chat completion successfully', async () => {
      const messages = [
        { role: 'user', content: 'Hello' }
      ];

      const response = await api.createChatCompletion(messages);

      expect(response).toBeDefined();
      expect(response.choices[0].message.content).toBe('Hello, how can I help you?');
      expect(response.usage.totalTokens).toBeGreaterThan(0);
    });

    test('should handle streaming chat completion', async () => {
      const messages = [
        { role: 'user', content: 'Count to 3' }
      ];

      const chunks: (ApiStreamTextChunk | ApiStreamUsageChunk)[] = [];
      
      await api.createStreamingChatCompletion(messages, {
        onChunk: (chunk) => chunks.push(chunk)
      });

      const textChunks = chunks.filter((c): c is ApiStreamTextChunk => 'text' in c);
      const usageChunks = chunks.filter((c): c is ApiStreamUsageChunk => 'usage' in c);

      expect(textChunks).toHaveLength(3);
      expect(usageChunks).toHaveLength(1);
      expect(textChunks.map(c => c.text).join('')).toBe('1, 2, 3');
    });

    test('should handle rate limiting', async () => {
      const messages = [
        { role: 'user', content: 'Test' }
      ];

      const promises = Array(70).fill(null).map(() => 
        api.createChatCompletion(messages)
      );

      const results = await Promise.allSettled(promises);
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      expect(fulfilled).toHaveLength(60); // Rate limit per minute
      expect(rejected).toHaveLength(10);
    });

    test('should handle retries on temporary failures', async () => {
      const messages = [
        { role: 'user', content: 'Test retry' }
      ];

      mockProvider.simulateTemporaryFailure(2); // Fail twice then succeed

      const response = await api.createChatCompletion(messages);

      expect(response).toBeDefined();
      expect(mockProvider.getCallCount()).toBe(3); // Original + 2 retries
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid API key', async () => {
      api.updateConfig({ apiKey: 'invalid-key' });
      
      await expect(
        api.createChatCompletion([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow('Invalid API key');
    });

    test('should handle network errors', async () => {
      mockProvider.simulateNetworkError();
      
      await expect(
        api.createChatCompletion([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow('Network error');
    });

    test('should handle rate limit errors', async () => {
      mockProvider.simulateRateLimitError();
      
      await expect(
        api.createChatCompletion([{ role: 'user', content: 'Test' }])
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Configuration', () => {
    test('should update configuration dynamically', async () => {
      const newConfig: Partial<ApiConfiguration> = {
        temperature: 0.9,
        maxTokens: 2000
      };

      api.updateConfig(newConfig);

      const messages = [
        { role: 'user', content: 'Test config' }
      ];

      const response = await api.createChatCompletion(messages);

      expect(response.config.temperature).toBe(0.9);
      expect(response.config.maxTokens).toBe(2000);
    });

    test('should validate configuration', () => {
      expect(() => {
        api.updateConfig({ temperature: 2.0 });
      }).toThrow('Temperature must be between 0 and 1');

      expect(() => {
        api.updateConfig({ maxTokens: -1 });
      }).toThrow('Max tokens must be positive');
    });
  });

  describe('Telemetry', () => {
    test('should track API usage metrics', async () => {
      const messages = [
        { role: 'user', content: 'Test metrics' }
      ];

      await api.createChatCompletion(messages);

      const metrics = api.getTelemetryMetrics();
      
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.totalTokens).toBeGreaterThan(0);
      expect(metrics.averageLatency).toBeGreaterThan(0);
    });

    test('should track error rates', async () => {
      const messages = [
        { role: 'user', content: 'Test errors' }
      ];

      mockProvider.simulateError();
      
      try {
        await api.createChatCompletion(messages);
      } catch (e) {
        // Expected error
      }

      const metrics = api.getTelemetryMetrics();
      
      expect(metrics.errorCount).toBe(1);
      expect(metrics.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Provider Management', () => {
    test('should switch providers dynamically', async () => {
      const newProvider = new MockProvider();
      api.setProvider(newProvider);

      const messages = [
        { role: 'user', content: 'Test provider' }
      ];

      const response = await api.createChatCompletion(messages);

      expect(response.provider).toBe('mock');
      expect(newProvider.getCallCount()).toBe(1);
    });

    test('should handle provider-specific configurations', async () => {
      const providerConfig = {
        customOption: 'value'
      };

      api.setProviderConfig(providerConfig);

      const messages = [
        { role: 'user', content: 'Test config' }
      ];

      const response = await api.createChatCompletion(messages);

      expect(response.providerConfig).toEqual(providerConfig);
    });
  });
}); 