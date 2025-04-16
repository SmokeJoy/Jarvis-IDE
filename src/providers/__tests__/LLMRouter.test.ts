import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMRouter, registerProvider } from '@/providers/LLMRouter';
import type {
  PromptPayload,
  LLMProviderHandler,
  LLMResponse,
  LLMStreamToken,
} from '@shared/types/llm.types';

const mockHandler: LLMProviderHandler = {
  sendPrompt: vi.fn(async (payload) => ({
    requestId: payload.requestId,
    output: 'mock-output',
  })),
  streamPrompt: vi.fn(async (_payload, onToken) => {
    onToken({ requestId: '123', token: 'a' });
    onToken({ requestId: '123', token: '', isFinal: true });
  }),
  cancel: vi.fn(),
};

beforeEach(() => {
  LLMRouter.registerProvider('mock' as any, mockHandler);
});

describe('LLMRouter', () => {
  it('invoca sendPrompt sul provider corretto', async () => {
    const payload: PromptPayload = {
      requestId: '123',
      providerId: 'mock' as any,
      text: 'hello',
    };
    const result = await LLMRouter.sendPrompt(payload);
    expect(mockHandler.sendPrompt).toHaveBeenCalledWith(payload);
    expect(result.output).toBe('mock-output');
  });

  it('invoca streamPrompt e riceve token', async () => {
    const tokens: LLMStreamToken[] = [];
    const payload: PromptPayload = {
      requestId: '123',
      providerId: 'mock' as any,
      text: 'stream this',
    };
    await LLMRouter.streamPrompt(payload, (token) => tokens.push(token));
    expect(tokens).toEqual([
      { requestId: '123', token: 'a' },
      { requestId: '123', token: '', isFinal: true },
    ]);
  });

  it('chiama cancel su tutti i provider registrati', () => {
    LLMRouter.cancel('456');
    expect(mockHandler.cancel).toHaveBeenCalledWith('456');
  });

  it('lancia errore se il provider non è registrato', async () => {
    const payload: PromptPayload = {
      requestId: 'fail',
      providerId: 'ghost' as any,
      text: '???',
    };
    await expect(() => LLMRouter.sendPrompt(payload)).rejects.toThrow(
      '[LLMRouter] Provider non registrato: ghost'
    );
  });
}); 