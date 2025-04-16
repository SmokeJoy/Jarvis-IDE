import { describe, it, expect, vi } from 'vitest';
import { JarvisProvider } from '../remote/JarvisProvider';
import type { PromptPayload, LLMStreamToken } from '@shared/types/llm.types';

describe('JarvisProvider', () => {
  it('should echo back text in sendPrompt', async () => {
    const payload: PromptPayload = {
      requestId: 'echo-1',
      text: 'Hello Jarvis',
      providerId: 'jarvis' as any,
    };
    const res = await JarvisProvider.sendPrompt(payload);
    expect(res.output).toBe('echo: Hello Jarvis');
    expect(res.requestId).toBe(payload.requestId);
  });

  it('should stream individual words with streamPrompt', async () => {
    const tokens: LLMStreamToken[] = [];
    const payload: PromptPayload = {
      requestId: 'stream-1',
      text: 'this is a test',
      providerId: 'jarvis' as any,
    };

    await JarvisProvider.streamPrompt(payload, (token) => tokens.push(token));

    expect(tokens).toEqual([
      { requestId: 'stream-1', token: 'this' },
      { requestId: 'stream-1', token: 'is' },
      { requestId: 'stream-1', token: 'a' },
      { requestId: 'stream-1', token: 'test' },
      { requestId: 'stream-1', token: '', isFinal: true },
    ]);
  });

  it('should log cancel (no-op)', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    JarvisProvider.cancel('cancel-123');
    expect(spy).toHaveBeenCalledWith(
      '[JarvisProvider] Cancel richiesto per requestId: cancel-123 (no-op)'
    );
    spy.mockRestore();
  });
}); 