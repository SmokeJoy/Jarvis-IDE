import { Anthropic } from '@anthropic-ai/sdk';
import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../shared/types/api.types';
import OpenAI, { CompletionUsage, ChatCompletionChunk, ChatCompletionMessageParam } from 'openai';
import {
  openAiNativeDefaultModelId,
  OpenAiNativeModelId,
  openAiNativeModels,
  openAiModelInfoSaneDefaults,
} from '../../shared/api';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { calculateApiCostOpenAI } from '../../utils/cost';
import { ApiStream } from '../transform/stream';
import { createSafeMessage } from "../../shared/types/message";

export class OpenAiNativeHandler implements ApiHandler {
  private options: ApiHandlerOptions;
  private client: OpenAI;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new OpenAI({
      apiKey: this.options.openAiNativeApiKey,
    });
  }

  private async *yieldUsage(info: ModelInfo, usage: CompletionUsage | undefined): ApiStream {
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const cacheReadTokens = 0;
    const cacheWriteTokens = 0;
    const totalCost = calculateApiCostOpenAI(
      info,
      inputTokens,
      outputTokens,
      cacheWriteTokens,
      cacheReadTokens
    );
    yield {
      type: 'usage',
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      cacheWriteTokens: cacheWriteTokens,
      cacheReadTokens: cacheReadTokens,
      totalCost: totalCost,
    };
  }

  async *createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    const maxRetries = 2;
    const retryDelay = 500;
    let attempt = 0;

    while (true) {
      try {
        attempt++;
        const model = this.getModel();

        switch (model.id) {
          case 'o1':
          case 'o1-preview':
          case 'o1-mini': {
            // o1 doesnt support streaming, non-1 temp, or system prompt
            const stream = await this.client.chat.completions.create({
              model: model.id,
              messages: [
                createSafeMessage({role: 'user', content: systemPrompt}),
                ...convertToOpenAiMessages(messages),
              ],
              stream: true,
              stream_options: { include_usage: true },
            });

            let lastChunk: ChatCompletionChunk | null = null;

            for await (const chunk of stream) {
              lastChunk = chunk;
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                yield {
                  type: 'text',
                  text: delta.content,
                };
              }
            }

            if (lastChunk?.usage) {
              yield* this.yieldUsage(model.info, lastChunk.usage);
            }

            break;
          }
          case 'o3-mini': {
            const stream = await this.client.chat.completions.create({
              model: model.id,
              messages: [
                createSafeMessage({role: 'system', content: systemPrompt}),
                ...convertToOpenAiMessages(messages),
              ],
              stream: true,
              stream_options: { include_usage: true },
            });

            let lastChunk: ChatCompletionChunk | null = null;

            for await (const chunk of stream) {
              lastChunk = chunk;
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                yield {
                  type: 'text',
                  text: delta.content,
                };
              }
            }

            if (lastChunk?.usage) {
              yield* this.yieldUsage(model.info, lastChunk.usage);
            }
            break;
          }
          default: {
            const stream = await this.client.chat.completions.create({
              model: model.id,
              // max_completion_tokens: this.getModel().info.maxTokens,
              temperature: 0,
              messages: [
                createSafeMessage({role: 'system', content: systemPrompt}),
                ...convertToOpenAiMessages(messages),
              ],
              stream: true,
              stream_options: { include_usage: true },
            });

            let lastChunk: ChatCompletionChunk | null = null;

            for await (const chunk of stream) {
              lastChunk = chunk;

              if (chunk.choices?.[0]?.delta?.content) {
                yield {
                  type: 'text',
                  text: chunk.choices[0].delta.content,
                };
              }
            }

            // Yield usage only from the last chunk
            if (lastChunk?.usage) {
              yield* this.yieldUsage(model.info, lastChunk.usage);
            }
          }
        }
        break; // Se arriviamo qui, il metodo è riuscito e usciamo dal ciclo
      } catch (error) {
        console.error(`Tentativo ${attempt}/${maxRetries + 1} fallito:`, error);
        if (attempt > maxRetries) {
          console.error(
            `Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`,
            error
          );
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  getModel(): { id: OpenAiNativeModelId; info: ModelInfo } {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in openAiNativeModels) {
      const id = modelId as OpenAiNativeModelId;
      return { id, info: openAiNativeModels[id] };
    }
    return {
      id: openAiNativeDefaultModelId,
      info: openAiNativeModels[openAiNativeDefaultModelId],
    };
  }
}
