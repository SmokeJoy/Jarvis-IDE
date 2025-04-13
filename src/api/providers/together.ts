import OpenAI from 'openai';
import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../shared/types/api.types';
import { openAiModelInfoSaneDefaults } from '../../shared/api';
import { calculateApiCostOpenAI } from '../../utils/cost';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk } from '../../shared/types/api.types';
import { convertToR1Format } from '../transform/r1-format';
import { BaseStreamHandler } from '../handlers/BaseStreamHandler';
import { logger } from '../../utils/logger';
import { ChatMessage } from '../../types/chat.types';
import { ChatCompletionMessageParam } from '../../types/provider-types/openai-types';
import { createSafeMessage } from '../../shared/types/message';
import { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider';
import { LLMProviderId } from '../../shared/types/llm.types';

export class TogetherHandler extends BaseLLMProvider {
  readonly provider = LLMProviderId.Together;
  readonly name = 'Together AI';
  readonly isLocal = false;

  private options: ApiHandlerOptions;
  private client: OpenAI;

  constructor(options: ApiHandlerOptions) {
    super(options.apiKey, options.endpoint || 'https://api.together.xyz/v1');
    this.options = options;
    this.client = new OpenAI({
      baseURL: 'https://api.together.xyz/v1',
      apiKey: this.options.togetherApiKey,
    });
  }

  async *createMessage(systemPrompt: string, messages: ChatMessage[]): ApiStream {
    const maxRetries = 2;
    const retryDelay = 500;
    let attempt = 0;

    while (true) {
      try {
        attempt++;
        const modelId = this.options.togetherModelId ?? '';
        const isDeepseekReasoner = modelId.includes('deepseek-reasoner');

        let openAiMessages: ChatCompletionMessageParam[] = [
          createSafeMessage({role: 'system', content: systemPrompt}),
          ...convertToOpenAiMessages(messages),
        ];

        if (isDeepseekReasoner) {
          openAiMessages = convertToR1Format([
            createSafeMessage({role: 'user', content: systemPrompt}),
            ...messages,
          ]);
        }

        const stream = await this.client.chat.completions.create({
          model: modelId,
          messages: openAiMessages,
          temperature: 0,
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

          if (delta && 'reasoning_content' in delta && delta.reasoning_content) {
            yield {
              type: 'reasoning',
              reasoning: (delta.reasoning_content as string | undefined) || '',
            };
          }

          if (chunk.usage) {
            yield {
              type: 'usage',
              inputTokens: chunk.usage.prompt_tokens || 0,
              outputTokens: chunk.usage.completion_tokens || 0,
            };
          }
        }
        break; // Se arriviamo qui, il metodo è riuscito e usciamo dal ciclo
      } catch (error) {
        console.error(`[together] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error);
        if (attempt > maxRetries) {
          console.error(
            `[together] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`,
            error
          );
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.togetherModelId ?? '',
      info: openAiModelInfoSaneDefaults,
    };
  }

  protected formatMessages(messages: LLMMessage[]): any {
    // ... logica specifica ...
  }

  async call(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const processedMessages = this.applyMCPOptions(messages, options);
    const formattedMessages = this.formatMessages(processedMessages);
    // ... logica chiamata API ...
  }

  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    const processedMessages = this.applyMCPOptions(messages, options);
    const formattedMessages = this.formatMessages(processedMessages);
    // ... logica chiamata API streaming ...
  }

  async listModels(): Promise<string[]> {
    // ... logica lista modelli ...
  }

  isConfigured(): boolean {
    // ... logica configurazione ...
  }

  // ... eventuale logica specifica ...
}
