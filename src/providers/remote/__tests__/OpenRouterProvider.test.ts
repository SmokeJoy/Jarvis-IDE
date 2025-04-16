import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenRouterProvider } from '../OpenRouterProvider';
import type { PromptPayload, LLMStreamToken } from '@shared/types/llm.types';

describe('OpenRouterProvider', () => {
  const apiKey = 'test-api-key';
  const basePayload: PromptPayload = {
    requestId: 'req-1',
    text: 'Hello, OpenRouter!',
    providerId: 'openrouter',
    modelId: 'mistralai/mixtral-8x7b',
    temperature: 0.7,
    apiKey,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sendPrompt restituisce una risposta valida', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Ciao da OpenRouter!' } }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    const res = await OpenRouterProvider.sendPrompt(basePayload);
    expect(res.output).toBe('Ciao da OpenRouter!');
    expect(res.usage?.totalTokens).toBe(30);
  });

  it('sendPrompt lancia errore se manca la API key', async () => {
    await expect(OpenRouterProvider.sendPrompt({ ...basePayload, apiKey: undefined })).rejects.toThrow('API key mancante');
  });

  it('streamPrompt chiama onToken con token e DONE', async () => {
    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n'),
      encoder.encode('data: [DONE]\n'),
    ];
    const stream = {
      getReader: () => {
        let i = 0;
        return {
          read: () => {
            if (i < chunks.length) return Promise.resolve({ done: false, value: chunks[i++] });
            return Promise.resolve({ done: true, value: undefined });
          },
        };
      },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });
    const onToken = vi.fn<(t: LLMStreamToken) => void>();
    await OpenRouterProvider.streamPrompt(basePayload, onToken);
    expect(onToken).toHaveBeenCalledWith({ requestId: 'req-1', token: 'Hello' });
    expect(onToken).toHaveBeenCalledWith({ requestId: 'req-1', token: '', isFinal: true });
  });

  it('cancel logga info (no-op)', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    OpenRouterProvider.cancel('cancel-xyz');
    expect(spy).toHaveBeenCalledWith('[OpenRouterProvider] Cancel richiesto per cancel-xyz (no-op)');
  });
}); 