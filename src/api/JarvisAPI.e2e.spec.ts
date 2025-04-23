import { vi } from 'vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JarvisAPI } from './JarvisAPI';
import { OpenAIProvider } from '../providers/openai/openai-provider';
import { 
  ApiStreamTextChunk, 
  ApiStreamUsageChunk,
  LLMProviderId,
  ApiConfiguration,
  ApiResponse 
} from '../shared/types/api.types';

vi.mock('../providers/openai/OpenAIProvider');

describe('JarvisAPI E2E Tests', () => {
  let api: JarvisAPI;
  let mockProvider: jest.Mocked<OpenAIProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = new OpenAIProvider() as jest.Mocked<OpenAIProvider>;
    api = new JarvisAPI();
  });

  it('should handle complete chat message roundtrip', async () => {
    // Setup provider config
    const config: ApiConfiguration = {
      providerId: LLMProviderId.OpenAI,
      apiKey: 'test-key',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    };

    // Mock stream chunks
    const mockChunks = [
      { type: 'text', content: 'Hello' } as ApiStreamTextChunk,
      { type: 'text', content: ' world!' } as ApiStreamTextChunk,
      { 
        type: 'usage', 
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      } as ApiStreamUsageChunk
    ];

    // Setup provider mock
    mockProvider.sendMessage.mockImplementation(async function* () {
      for (const chunk of mockChunks) {
        yield chunk;
      }
    });

    // Initialize API with config
    await api.initialize(config);

    // Send message and collect response
    const message = 'Test message';
    const chunks: (ApiStreamTextChunk | ApiStreamUsageChunk)[] = [];
    
    for await (const chunk of api.sendMessage(message)) {
      chunks.push(chunk);
    }

    // Verify chunks
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual(mockChunks[0]);
    expect(chunks[1]).toEqual(mockChunks[1]);
    expect(chunks[2]).toEqual(mockChunks[2]);

    // Verify provider calls
    expect(mockProvider.sendMessage).toHaveBeenCalledWith(message);
  });

  it('should handle stream errors gracefully', async () => {
    const config: ApiConfiguration = {
      providerId: LLMProviderId.OpenAI,
      apiKey: 'test-key',
      model: 'gpt-4'
    };

    // Mock error in stream
    mockProvider.sendMessage.mockImplementation(async function* () {
      yield { type: 'text', content: 'Start' } as ApiStreamTextChunk;
      throw new Error('Stream error');
    });

    await api.initialize(config);

    // Verify error handling
    await expect(async () => {
      const chunks = [];
      for await (const chunk of api.sendMessage('test')) {
        chunks.push(chunk);
      }
    }).rejects.toThrow('Stream error');
  });

  it('should handle multiple message sequences', async () => {
    const config: ApiConfiguration = {
      providerId: LLMProviderId.OpenAI,
      apiKey: 'test-key',
      model: 'gpt-4'
    };

    const mockResponses = [
      [{ type: 'text', content: 'Response 1' }],
      [{ type: 'text', content: 'Response 2' }]
    ];

    let callCount = 0;
    mockProvider.sendMessage.mockImplementation(async function* () {
      const response = mockResponses[callCount++];
      for (const chunk of response) {
        yield chunk as ApiStreamTextChunk;
      }
    });

    await api.initialize(config);

    // Send multiple messages
    const messages = ['Message 1', 'Message 2'];
    
    for (const message of messages) {
      const chunks = [];
      for await (const chunk of api.sendMessage(message)) {
        chunks.push(chunk);
      }
      expect(chunks).toHaveLength(1);
    }

    expect(mockProvider.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('should validate provider configuration', async () => {
    const invalidConfig = {
      providerId: 'invalid' as LLMProviderId,
      apiKey: 'test-key'
    };

    await expect(api.initialize(invalidConfig)).rejects.toThrow();
  });

  it('should track usage metrics correctly', async () => {
    const config: ApiConfiguration = {
      providerId: LLMProviderId.OpenAI,
      apiKey: 'test-key',
      model: 'gpt-4'
    };

    const usageChunk: ApiStreamUsageChunk = {
      type: 'usage',
      promptTokens: 50,
      completionTokens: 100,
      totalTokens: 150
    };

    mockProvider.sendMessage.mockImplementation(async function* () {
      yield { type: 'text', content: 'Response' } as ApiStreamTextChunk;
      yield usageChunk;
    });

    await api.initialize(config);

    const chunks = [];
    for await (const chunk of api.sendMessage('test')) {
      chunks.push(chunk);
    }

    const lastChunk = chunks[chunks.length - 1] as ApiStreamUsageChunk;
    expect(lastChunk).toEqual(usageChunk);
    expect(lastChunk.totalTokens).toBe(150);
  });
}); 
 