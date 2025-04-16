import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../OpenAIProvider';
import type { PromptPayload, LLMStreamToken } from '@shared/types/llm.types';

const apiKey = 'test-api-key';

const basePayload: PromptPayload = {
  requestId: 'test-req',
  text: 'Hello, world',
  providerId: 'openai',
  modelId: 'gpt-4',
  temperature: 0.7,
  apiKey,
};

describe('OpenAIProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sendPrompt restituisce una risposta valida', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Ciao!' } }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const res = await OpenAIProvider.sendPrompt(basePayload);
    expect(res.output).toBe('Ciao!');
    expect(res.usage?.totalTokens).toBe(30);
  });

  it('sendPrompt lancia errore se la fetch fallisce', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Invalid API key',
    });

    await expect(OpenAIProvider.sendPrompt(basePayload)).rejects.toThrow('Errore OpenAI API');
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

    await OpenAIProvider.streamPrompt(basePayload, onToken);

    expect(onToken).toHaveBeenCalledWith({ requestId: 'test-req', token: 'Hello' });
    expect(onToken).toHaveBeenCalledWith({ requestId: 'test-req', token: '', isFinal: true });
  });

  it('cancel logga info (no-op)', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    OpenAIProvider.cancel('cancel-test-id');
    expect(spy).toHaveBeenCalledWith('[OpenAIProvider] Cancel richiesto per requestId: cancel-test-id (no-op)');
  });
}); 