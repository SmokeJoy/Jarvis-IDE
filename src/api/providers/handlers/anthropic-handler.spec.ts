import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicHandler } from './anthropic-handler';
import type { Message } from '@shared/types/chat';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  const mockMessages = {
    create: vi.fn().mockImplementation(async ({ stream, messages }) => {
      if (stream) {
        const chunks = [
          {
            type: 'message_start',
            message: {
              id: 'msg_1',
              content: [],
              role: 'assistant',
              usage: { input_tokens: 10, output_tokens: 5 }
            }
          },
          {
            type: 'content_block_start',
            content_block: { type: 'text', text: '' }
          },
          {
            type: 'content_block_delta',
            delta: { type: 'text', text: 'Hello' }
          },
          {
            type: 'content_block_delta',
            delta: { type: 'text', text: ' World' }
          },
          {
            type: 'content_block_stop',
            usage: { input_tokens: 10, output_tokens: 10 }
          },
          { type: 'message_delta', delta: { stop_reason: 'end_turn' } }
        ];

        return {
          async *[Symbol.asyncIterator]() {
            for (const chunk of chunks) {
              yield chunk;
            }
          }
        };
      }

      return {
        id: 'msg_1',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello World' }],
        model: 'claude-3-opus-20240229',
        usage: { input_tokens: 10, output_tokens: 10 }
      };
    })
  };

  return {
    Anthropic: vi.fn().mockImplementation(() => ({
      messages: mockMessages
    }))
  };
});

describe('AnthropicHandler', () => {
  let handler: AnthropicHandler;

  beforeEach(() => {
    handler = new AnthropicHandler('test-api-key');
  });

  describe('mapMessages', () => {
    it('should correctly map messages for Anthropic format', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' }
      ];

      const mappedMessages = handler['mapMessages'](messages);

      expect(mappedMessages).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' }
      ]);
    });
  });

  describe('chat', () => {
    it('should return chat completion with correct format', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' }
      ];

      const response = await handler.chat(messages);

      expect(response).toEqual({
        content: 'Hello World',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 10,
          total_tokens: 20
        }
      });
    });
  });

  describe('chatStream', () => {
    it('should yield correct streaming chunks', async () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' }
      ];

      const chunks: string[] = [];
      let finalUsage = null;

      for await (const chunk of handler.chatStream(messages)) {
        if (typeof chunk === 'string') {
          chunks.push(chunk);
        } else {
          finalUsage = chunk;
        }
      }

      expect(chunks).toEqual(['Hello', ' World']);
      expect(finalUsage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 10,
        total_tokens: 20
      });
    });
  });
}); 