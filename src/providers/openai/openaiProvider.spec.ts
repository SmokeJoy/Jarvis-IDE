import { vi } from 'vitest';
import { z } from 'zod';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOpenAIModels, sendOpenAIMessage } from './openai-provider';

describe('OpenAI Provider', () => {
  const mockApiKey = 'sk-test-key';
  const mockModelId = 'gpt-4';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('fetchOpenAIModels', () => {
    it('fetches and filters GPT models from OpenAI API', async () => {
      const mockResponse = {
        data: [
          { id: 'gpt-4', object: 'model', created: 1677610602, owned_by: 'openai' },
          { id: 'gpt-3.5-turbo', object: 'model', created: 1677610602, owned_by: 'openai' },
          { id: 'text-davinci-003', object: 'model', created: 1677610602, owned_by: 'openai' }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const models = await fetchOpenAIModels(mockApiKey);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          }
        })
      );

      expect(models).toHaveLength(2);
      expect(models[0]).toMatchObject({
        id: 'gpt-4',
        name: 'gpt-4',
        provider: 'openai'
      });
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      });

      await expect(fetchOpenAIModels(mockApiKey)).rejects.toThrow('OpenAI API error: Unauthorized');
    });
  });

  describe('sendOpenAIMessage', () => {
    it('sends a message and receives a response', async () => {
      const mockCompletion = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677610602,
        model: mockModelId,
        choices: [{
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you today?'
          },
          finish_reason: 'stop',
          index: 0
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCompletion)
      });

      const response = await sendOpenAIMessage(mockApiKey, mockModelId, 'Hello!');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining(mockModelId)
        })
      );

      expect(response).toBe('Hello! How can I help you today?');
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(sendOpenAIMessage(mockApiKey, mockModelId, 'Hello!')).rejects.toThrow('OpenAI API error: Bad Request');
    });

    it('handles empty or invalid responses', async () => {
      const mockEmptyCompletion = {
        id: 'chatcmpl-123',
        choices: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmptyCompletion)
      });

      const response = await sendOpenAIMessage(mockApiKey, mockModelId, 'Hello!');
      expect(response).toBe('');
    });
  });
}); 
 