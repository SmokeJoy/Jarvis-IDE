import { Anthropic } from '@anthropic-ai/sdk';
import { Message } from '../../../shared/types/chat.types';
import { AnthropicOptions, AnthropicUsage } from '../schemas/anthropic.schema';
import { BaseHandler } from './base-handler';

export class AnthropicHandler extends BaseHandler {
  private client: Anthropic;
  private modelId: string;

  constructor(options: AnthropicOptions) {
    super();
    this.client = new Anthropic({
      apiKey: options.apiKey
    });
    this.modelId = options.anthropicModelId;
  }

  mapMessages(messages: Message[]): Message[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  async chat(messages: Message[], maxTokens?: number): Promise<{ content: string; usage: AnthropicUsage }> {
    const mappedMessages = this.mapMessages(messages);

    const response = await this.client.messages.create({
      model: this.modelId,
      messages: mappedMessages,
      max_tokens: maxTokens
    });

    return {
      content: response.content,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.total_tokens
      }
    };
  }

  async *chatStream(messages: Message[], maxTokens?: number): AsyncGenerator<{ content: string; usage: AnthropicUsage }> {
    const mappedMessages = this.mapMessages(messages);

    const stream = await this.client.messages.create({
      model: this.modelId,
      messages: mappedMessages,
      max_tokens: maxTokens,
      stream: true
    });

    for await (const chunk of stream) {
      yield {
        content: chunk.content,
        usage: {
          input_tokens: chunk.usage.input_tokens,
          output_tokens: chunk.usage.output_tokens,
          total_tokens: chunk.usage.total_tokens
        }
      };
    }
  }
} 