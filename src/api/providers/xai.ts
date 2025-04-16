import { Anthropic } from '@anthropic-ai/sdk';
// import type { ChatCompletionMessageParam } from 'openai/resources'; // Commentato import problematico
import OpenAI from 'openai';
import { ApiHandler } from '../';
import { XaiHandlerOptions } from '../../shared/types/handlers/xai-handler.types';
import { XAIModelId, xaiDefaultModelId, xaiModels } from '../../shared/api';
import { OpenAITransformer } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk, ApiStreamTextChunk, ApiStreamUsageChunk } from '../../src/shared/types/api.types';
import { ChatMessage, createChatMessage } from '../../src/shared/types/chat.types';

export class XAIHandler implements ApiHandler {
  private options: XaiHandlerOptions;
  private client: OpenAI;

  constructor(options: XaiHandlerOptions) {
    this.options = options;
    this.client = new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: this.options.xaiApiKey,
    });
  }

  createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    // Salvo `this` per usarlo nel generatore
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      type: 'stream',
      // Uso una funzione generatore asincrona standard
      chunks: (async function* (): AsyncGenerator<ApiStreamChunk> {
        const chatMessages = messages.map(
          (msg) =>
            (createChatMessage({role: msg.role, content: msg.content as string, timestamp: Date.now()})) as ChatMessage
        );

        const allMessages = [
          createChatMessage({role: 'system', content: systemPrompt, timestamp: Date.now()}) as ChatMessage,
          ...chatMessages,
        ];

        // TODO: FIX 3 - Assicurarsi che questo restituisca il tipo corretto ChatCompletionMessageParam[]
        const openAiMessages = OpenAITransformer.toLLMMessages(allMessages);

        // Accedo a maxTokens in modo sicuro
        const modelInfo = self.getModel().info;
        const maxTokens = typeof modelInfo.maxTokens === 'number' ? modelInfo.maxTokens : undefined;

        const stream = await self.client.chat.completions.create({
          model: self.getModel().id,
          // Uso il valore verificato o undefined
          max_completion_tokens: maxTokens,
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
              content: delta.content,
            } as ApiStreamTextChunk;
          }

          if (chunk.usage) {
            yield {
              type: 'usage',
              usageData: {
                inputTokens: chunk.usage.prompt_tokens || 0, // Uso prompt_tokens standard
                outputTokens: chunk.usage.completion_tokens || 0,
                // Rimosso accesso a proprietà non standard
                // cacheReadTokens: chunk.usage.prompt_cache_hit_tokens || 0,
                // cacheWriteTokens: chunk.usage.prompt_cache_miss_tokens || 0,
              },
            } as ApiStreamUsageChunk;
          }
        }
      })(), // Chiamo la funzione generatore
    };
  }

  getModel(): { id: XAIModelId; info: Record<string, unknown> } {
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
