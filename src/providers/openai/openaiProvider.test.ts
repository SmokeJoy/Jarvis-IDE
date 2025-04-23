import { vi } from 'vitest';
import { z } from 'zod';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOpenAIModels, sendOpenAIMessage } from './openai-provider';
import { ApiHandlerOptions, LLMProviderId } from '@shared/types/api.types';

describe('OpenAI Provider', () => {
  const mockApiKey = 'test-api-key';
  const mockOrgId = 'test-org-id';

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  describe('fetchOpenAIModels', () => {
    it('should fetch and filter GPT models', async () => {
      const mockResponse = {
        data: [
          { id: 'gpt-4', context_window: 8192 },
          { id: 'gpt-3.5-turbo', context_window: 4096 },
          { id: 'not-gpt-model' },
          { id: 'gpt-4-deprecated', deprecated: true }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const models = await fetchOpenAIModels(mockApiKey, mockOrgId);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Organization': mockOrgId
          }
        })
      );

      expect(models).toHaveLength(3);
      expect(models[0]).toEqual({
        id: 'gpt-4',
        name: 'gpt-4',
        provider: LLMProviderId.OpenAI,
        contextWindow: 8192,
        deprecated: false
      });
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      });

      await expect(fetchOpenAIModels(mockApiKey)).rejects.toThrow('OpenAI API error: Unauthorized');
    });
  });

  describe('sendOpenAIMessage', () => {
    const mockOptions: ApiHandlerOptions = {
      apiKey: mockApiKey,
      organizationId: mockOrgId,
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7
    };

    it('should send message and handle streaming response', async () => {
      const mockChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\\n',
        'data: {"usage":{"prompt_tokens":10,"completion_tokens":20,"total_tokens":30}}\\n',
        'data: [DONE]\\n'
      ];

      const mockReadable = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          for (const chunk of mockChunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: mockReadable
      });

      const stream = await sendOpenAIMessage(mockOptions);
      const reader = stream.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ type: 'text', content: 'Hello' });
      expect(chunks[1]).toEqual({ type: 'text', content: ' world' });
      expect(chunks[2]).toEqual({
        type: 'usage',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      });
    });

    it('should handle function calls in response', async () => {
      const mockChunk = 'data: {"choices":[{"delta":{"function_call":{"name":"test","arguments":"{\\"arg\\":\\"value\\"}"}}}]}\\n';
      
      const mockReadable = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(mockChunk));
          controller.close();
        }
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: mockReadable
      });

      const stream = await sendOpenAIMessage({
        ...mockOptions,
        functions: [{
          name: 'test',
          parameters: { type: 'object', properties: { arg: { type: 'string' } } }
        }]
      });

      const reader = stream.getReader();
      const { value } = await reader.read();

      expect(value).toEqual({
        type: 'function_call',
        name: 'test',
        arguments: '{"arg":"value"}'
      });
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(sendOpenAIMessage(mockOptions)).rejects.toThrow('OpenAI API error: Bad Request');
    });

    it('should handle missing response body', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        body: null
      });

      await expect(sendOpenAIMessage(mockOptions)).rejects.toThrow('No response body received');
    });
  });
}); 
 