import type {
  PromptPayload,
  LLMResponse,
  LLMProviderHandler,
  LLMStreamToken,
} from '@shared/types/llm.types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

function mapResponse(data: unknown, requestId: string, modelId?: string): LLMResponse {
  const d = data as Record<string, any>;
  return {
    requestId,
    output: d.choices?.[0]?.message?.content ?? '',
    modelId,
    usage: d.usage
      ? {
          promptTokens: d.usage.prompt_tokens,
          completionTokens: d.usage.completion_tokens,
          totalTokens: d.usage.total_tokens,
        }
      : undefined,
  };
}

async function sendPrompt(payload: PromptPayload): Promise<LLMResponse> {
  const { requestId, modelId = 'mistralai/mixtral-8x7b', text, temperature = 1, ...rest } = payload;
  const apiKey = rest.apiKey ?? '';
  if (!apiKey) throw new Error('OpenRouterProvider: API key mancante');

  const body = {
    model: modelId,
    messages: [{ role: 'user', content: text }],
    temperature,
    stream: false,
  };

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  return mapResponse(data, requestId, modelId);
}

async function streamPrompt(
  payload: PromptPayload,
  onToken: (t: LLMStreamToken) => void
): Promise<void> {
  const { requestId, modelId = 'mistralai/mixtral-8x7b', text, temperature = 1, ...rest } = payload;
  const apiKey = rest.apiKey ?? '';
  if (!apiKey) throw new Error('OpenRouterProvider: API key mancante');

  const body = {
    model: modelId,
    messages: [{ role: 'user', content: text }],
    temperature,
    stream: true,
  };

  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) throw new Error(await res.text());

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let isFinal = false;

  while (!isFinal) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const json = trimmed.replace('data: ', '');
      if (json === '[DONE]') {
        isFinal = true;
        onToken({ requestId, token: '', isFinal: true });
        break;
      }
      try {
        const chunk = JSON.parse(json);
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) onToken({ requestId, token: content });
      } catch {
        // Ignora errori di parsing
      }
    }
  }
}

function cancel(requestId: string): void {
  // eslint-disable-next-line no-console
  console.info(`[OpenRouterProvider] Cancel richiesto per ${requestId} (no-op)`);
}

export const OpenRouterProvider: LLMProviderHandler = {
  sendPrompt,
  streamPrompt,
  cancel,
}; 