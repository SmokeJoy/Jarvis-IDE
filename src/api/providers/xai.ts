import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ApiHandler } from '../';
import { ApiHandlerOptions, ModelInfo } from '../../shared/types/api.types';
import { XAIModelId, xaiDefaultModelId, xaiModels } from '../../shared/api';
import { OpenAITransformer } from '../transform/openai-format';
import { ApiStream } from '../transform/stream';
import { ChatMessage } from '../../types/ChatMessage';
import { createSafeMessage } from "../../shared/types/message";

export class XAIHandler implements ApiHandler {
  private options: ApiHandlerOptions;
  private client: OpenAI;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: this.options.xaiApiKey,
    });
  }

  async *createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    // Converti i messaggi Anthropic in ChatMessage standard
    const chatMessages = messages.map(
      (msg) =>
        (createSafeMessage({role: msg.role, content: msg.content, timestamp: Date.now()})) as ChatMessage
    );

    // Aggiungi il prompt di sistema all'inizio
    const allMessages = [
      createSafeMessage({role: 'system', content: systemPrompt, timestamp: Date.now()}) as ChatMessage,
      ...chatMessages,
    ];

    // Converti al formato OpenAI
    const openAiMessages = OpenAITransformer.toLLMMessages(allMessages);

    const stream = await this.client.chat.completions.create({
      model: this.getModel().id,
      max_completion_tokens: this.getModel().info.maxTokens,
      temperature: 0,
      messages: openAiMessages,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield {
          type: 'text',
          text: delta.content,
        };
      }

      if (chunk.usage) {
        yield {
          type: 'usage',
          inputTokens: 0,
          outputTokens: chunk.usage.completion_tokens || 0,
          // @ts-ignore-next-line
          cacheReadTokens: chunk.usage.prompt_cache_hit_tokens || 0,
          // @ts-ignore-next-line
          cacheWriteTokens: chunk.usage.prompt_cache_miss_tokens || 0,
        };
      }
    }
  }

  getModel(): { id: XAIModelId; info: ModelInfo } {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in xaiModels) {
      const id = modelId as XAIModelId;
      return { id, info: xaiModels[id] };
    }
    return {
      id: xaiDefaultModelId,
      info: xaiModels[xaiDefaultModelId],
    };
  }
}
