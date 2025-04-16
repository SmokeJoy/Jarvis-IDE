import type {
  PromptPayload,
  LLMResponse,
  LLMStreamToken,
  LLMProviderHandler
} from '@shared/types/llm.types';

async function sendPrompt(payload: PromptPayload): Promise<LLMResponse> {
  const { requestId, text = '' } = payload;
  return {
    requestId,
    output: `echo: ${text}`,
  };
}

async function streamPrompt(
  payload: PromptPayload,
  onToken: (token: LLMStreamToken) => void
): Promise<void> {
  const { requestId, text = '' } = payload;
  const words = text.split(/\s+/).filter(Boolean);
  for (const word of words) {
    onToken({ requestId, token: word });
    // Simula un piccolo delay per realismo (opzionale)
    // await new Promise((r) => setTimeout(r, 10));
  }
  onToken({ requestId, token: '', isFinal: true });
}

function cancel(requestId: string): void {
  // eslint-disable-next-line no-console
  console.info(`[JarvisProvider] Cancel richiesto per requestId: ${requestId} (no-op)`);
}

export const JarvisProvider: LLMProviderHandler = {
  sendPrompt,
  streamPrompt,
  cancel,
}; 