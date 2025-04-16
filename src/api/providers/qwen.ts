import { Anthropic } from '@anthropic-ai/sdk';
import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../src/shared/types/api.types';
import OpenAI, { ChatCompletionMessageParam, ChatCompletionChunk } from 'openai';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk } from '../../src/shared/types/api.types';
import { convertToR1Format } from '../transform/r1-format';
import {
  qwenDefaultModelId,
  QwenModelId,
  qwenModels,
  MainlandQwenModelId,
  InternationalQwenModelId,
} from '../../shared/api';
import { ChatMessage, createChatMessage } from '../../src/shared/types/chat.types';

export interface QwenConfig {
  apiKey: string;
  baseUrl: string;
}

export class QwenProvider {
  private apiKey: string;
  private baseUrl: string;
  private modelId: MainlandQwenModelId | InternationalQwenModelId;

  constructor(config: QwenConfig, modelId: MainlandQwenModelId | InternationalQwenModelId) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.modelId = modelId;
  }

  async *streamChat(
    messages: ChatCompletionMessageParam[],
    signal?: AbortSignal
  ): AsyncGenerator<ApiStreamChunk> {
    const anthropicMessages = messages.map((msg) => (createChatMessage({role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content as string,
        timestamp: Date.now()
    }))) as Anthropic.Messages.MessageParam[];

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: anthropicMessages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (
                parsed &&
                typeof parsed === 'object' &&
                'choices' in parsed &&
                Array.isArray(parsed.choices) &&
                parsed.choices.length > 0 &&
                typeof parsed.choices[0] === 'object' &&
                'delta' in parsed.choices[0] &&
                typeof parsed.choices[0].delta === 'object' &&
                'content' in parsed.choices[0].delta
              ) {
                yield {
                  type: 'text',
                  text: parsed.choices[0].delta.content,
                };
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async chat(messages: ChatCompletionMessageParam[], signal?: AbortSignal): Promise<ApiStream> {
    const anthropicMessages = messages.map((msg) => (createChatMessage({role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content as string,
        timestamp: Date.now()
    }))) as Anthropic.Messages.MessageParam[];

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: anthropicMessages,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (
      data &&
      typeof data === 'object' &&
      'choices' in data &&
      Array.isArray(data.choices) &&
      data.choices.length > 0 &&
      typeof data.choices[0] === 'object' &&
      'message' in data.choices[0] &&
      typeof data.choices[0].message === 'object' &&
      'content' in data.choices[0].message
    ) {
      return {
        type: 'text',
        text: data.choices[0].message.content,
      };
    }
    // Fallback in caso di risposta non valida
    return {
      type: 'text',
      text: 'Errore: risposta API non valida',
    };
  }
}

export class QwenHandler implements ApiHandler {
  private options: ApiHandlerOptions;
  private client: OpenAI;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new OpenAI({
      baseURL:
        this.options.qwenApiLine === 'china'
          ? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
          : 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
      apiKey: this.options.qwenApiKey,
    });
  }

  getModel(): { id: QwenModelId; info: ModelInfo } {
    const modelId = this.options.apiModelId;
    // Branch based on API line to let poor typescript know what to do
    if (this.options.qwenApiLine === 'china') {
      return {
        id: (modelId as QwenModelId) ?? qwenDefaultModelId,
        info: qwenModels[modelId as QwenModelId] ?? qwenModels[qwenDefaultModelId],
      };
    } else {
      return {
        id: (modelId as QwenModelId) ?? qwenDefaultModelId,
        info: qwenModels[modelId as QwenModelId] ?? qwenModels[qwenDefaultModelId],
      };
    }
  }

  async *createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    const model = this.getModel();
    const isDeepseekReasoner = model.id.includes('deepseek-r1');
    let openAiMessages: ChatCompletionMessageParam[] = [
      createChatMessage({role: 'system', content: systemPrompt,
          timestamp: Date.now()
    }),
      ...convertToOpenAiMessages(messages),
    ];
    if (isDeepseekReasoner) {
      openAiMessages = convertToR1Format([createChatMessage({role: 'user', content: systemPrompt,
          timestamp: Date.now()
    }), ...messages]);
    }
    const stream = await this.client.chat.completions.create({
      model: model.id,
      max_completion_tokens: model.info.maxTokens,
      messages: openAiMessages,
      stream: true,
      stream_options: { include_usage: true },
      ...(model.id === 'qwen-turbo' ? {} : { temperature: 0 }),
    });

    for await (const chunk of stream) {
      // Verifica sicura che il chunk sia valido e abbia le proprietà attese
      if (
        chunk &&
        typeof chunk === 'object' &&
        'choices' in chunk &&
        Array.isArray(chunk.choices) &&
        chunk.choices.length > 0
      ) {
        const delta = chunk.choices[0]?.delta ?? {};

        // Gestione sicura del contenuto testuale
        if (delta && typeof delta === 'object' && 'content' in delta && delta.content) {
          yield {
            type: 'text',
            text: delta.content,
          };
        }

        // Gestione sicura del contenuto di ragionamento
        if (
          delta &&
          typeof delta === 'object' &&
          'reasoning_content' in delta &&
          delta.reasoning_content
        ) {
          yield {
            type: 'reasoning',
            reasoning: (delta.reasoning_content as string | undefined) || '',
          };
        }
      }

      // Gestione sicura delle informazioni di utilizzo
      if (chunk && typeof chunk === 'object' && 'usage' in chunk && chunk.usage) {
        const usage = (chunk as ChatCompletionChunk).usage ?? {};
        yield {
          type: 'usage',
          inputTokens: usage.prompt_tokens || 0,
          outputTokens: usage.completion_tokens || 0,
          // Utilizziamo type assertion per accedere a proprietà specifiche dell'API Qwen
          cacheReadTokens: (usage as any).prompt_cache_hit_tokens || 0,
          cacheWriteTokens: (usage as any).prompt_cache_miss_tokens || 0,
        };
      }
    }
  }
}
