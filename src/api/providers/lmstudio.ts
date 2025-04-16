import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI, { ChatCompletionMessageParam } from 'openai';
import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../src/shared/types/api.types';
import { openAiModelInfoSaneDefaults } from '../../shared/api';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk } from '../../src/shared/types/api.types';
import { logger } from '../../utils/logger';
import { createChatMessage } from '../../src/shared/types/chat.types';
import { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider';
import { LLMProviderId } from '../../src/shared/types/providers.types';

export class LMStudioHandler extends BaseLLMProvider {
  readonly provider = LLMProviderId.LMStudio;
  readonly name = 'LM Studio';
  readonly isLocal = true;

  private options: ApiHandlerOptions;
  private client: OpenAI;

  constructor(options: ApiHandlerOptions) {
    super(options.apiKey, options.endpoint || 'http://127.0.0.1:1234/v1');
    this.options = options;
    this.client = new OpenAI({
      baseURL: (this.options.lmStudioBaseUrl || 'http://localhost:1234') + '/v1',
      apiKey: 'noop',
    });
    logger.debug(
      `[LmStudioHandler] Inizializzato con baseURL: ${this.options.lmStudioBaseUrl || 'http://localhost:1234'}`
    );
  }

  async *createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    const openAiMessages: ChatCompletionMessageParam[] = [
      createChatMessage({role: 'system', content: systemPrompt,
          timestamp: Date.now()
    }),
      ...convertToOpenAiMessages(messages),
    ];

    logger.info(
      `[LmStudioHandler] Inizio chiamata API LM Studio con modello: ${this.getModel().id}`
    );

    try {
      const stream = await this.client.chat.completions.create({
        model: this.getModel().id,
        messages: openAiMessages,
        temperature: 0,
        stream: true,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield {
            type: 'text',
            text: delta.content,
          };
        }
      }
    } catch (error) {
      logger.error(
        `[LmStudioHandler] Errore durante la chiamata API: ${error instanceof Error ? error.message : String(error)}`
      );
      // LM Studio doesn't return an error code/body for now
      throw new Error(
        "Please check the LM Studio developer logs to debug what went wrong. You may need to load the model with a larger context length to work with Jarvis IDE's prompts."
      );
    }
  }

  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.lmStudioModelId || '',
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

  // ... eventuale logica specifica per listModels, ecc ...
}
