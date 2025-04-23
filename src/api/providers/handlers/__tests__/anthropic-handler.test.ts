import { vi } from 'vitest';
import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { AnthropicHandler } from '../anthropic-handler';
import { Message } from '../../../../shared/types/chat.types';
import { ModelInfo } from '../../../../shared/types/model.types';
import { Anthropic } from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk');

describe('AnthropicHandler', () => {
  const mockOptions = {
    apiKey: 'test-key',
    anthropicModelId: 'claude-3',
    modelInfo: {
      id: 'claude-3',
      name: 'Claude 3',
      maxTokens: 100000,
      tokenizer: 'claude',
      provider: 'anthropic'
    } as ModelInfo
  };

  const mockMessages: Message[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi there!' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided options', () => {
    const handler = new AnthropicHandler(mockOptions);
    expect(handler).toBeDefined();
    expect(Anthropic).toHaveBeenCalledWith({ apiKey: mockOptions.apiKey });
  });

  it('should map messages correctly', () => {
    const handler = new AnthropicHandler(mockOptions);
    const mappedMessages = handler.mapMessages(mockMessages);
    
    expect(mappedMessages).toEqual([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' },
      { role: 'assistant', content: 'Hi there!' }
    ]);
  });

  it('should handle chat request successfully', async () => {
    const mockResponse = {
      content: [{ text: 'Test response' }],
      usage: {
        input_tokens: 10,
        output_tokens: 5
      }
    };

    const mockCreate = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        create: mockCreate
      }
    } as any));

    const handler = new AnthropicHandler(mockOptions);
    const result = await handler.chat(mockMessages);

    expect(result).toEqual({
      content: 'Test response',
      usage: {
        input_tokens: 10,
        output_tokens: 5
      }
    });

    expect(mockCreate).toHaveBeenCalledWith({
      model: mockOptions.anthropicModelId,
      messages: expect.any(Array),
      max_tokens: mockOptions.modelInfo?.maxTokens
    });
  });

  it('should handle chat stream successfully', async () => {
    const mockChunk = {
      content: [{ text: 'Test ' }],
      usage: {
        input_tokens: 10,
        output_tokens: 5
      }
    };

    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield mockChunk;
      }
    };

    const mockCreate = vi.fn().mockResolvedValue(mockStream);
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        create: mockCreate
      }
    } as any));

    const handler = new AnthropicHandler(mockOptions);
    const stream = handler.chatStream(mockMessages);

    for await (const chunk of stream) {
      expect(chunk).toEqual({
        content: 'Test ',
        usage: {
          input_tokens: 10,
          output_tokens: 5
        }
      });
    }

    expect(mockCreate).toHaveBeenCalledWith({
      model: mockOptions.anthropicModelId,
      messages: expect.any(Array),
      max_tokens: mockOptions.modelInfo?.maxTokens,
      stream: true
    });
  });

  it('should handle errors in chat request', async () => {
    const mockError = new Error('API Error');
    const mockCreate = vi.fn().mockRejectedValue(mockError);
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        create: mockCreate
      }
    } as any));

    const handler = new AnthropicHandler(mockOptions);
    await expect(handler.chat(mockMessages)).rejects.toThrow('API Error');
  });

  it('should handle errors in chat stream', async () => {
    const mockError = new Error('Stream Error');
    const mockCreate = vi.fn().mockRejectedValue(mockError);
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        create: mockCreate
      }
    } as any));

    const handler = new AnthropicHandler(mockOptions);
    const stream = handler.chatStream(mockMessages);
    await expect(stream.next()).rejects.toThrow('Stream Error');
  });
}); 