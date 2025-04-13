import { Message, Ollama } from 'ollama';
import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../shared/types/api.types';
import { openAiModelInfoSaneDefaults } from '../../shared/api';
import { convertToOllamaMessages } from '../transform/ollama-format';
import { ApiStream } from '../transform/stream';
import { ChatMessage } from '../../types/chat.types';
import { createSafeMessage } from "../../shared/types/message";

export class OllamaHandler implements ApiHandler {
  private options: ApiHandlerOptions;
  private client: Ollama;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new Ollama({ host: this.options.ollamaBaseUrl || 'http://localhost:11434' });
  }

  async *createMessage(systemPrompt: string, messages: ChatMessage[]): ApiStream {
    const ollamaMessages: Message[] = [
      createSafeMessage({role: 'system', content: systemPrompt}),
      ...convertToOllamaMessages(messages),
    ];

    const stream = await this.client.chat({
      model: this.getModel().id,
      messages: ollamaMessages,
      stream: true,
      options: {
        num_ctx: Number(this.options.ollamaApiOptionsCtxNum) || 32768,
      },
    });
    for await (const chunk of stream) {
      if (typeof chunk.message.content === 'string') {
        yield {
          type: 'text',
          text: chunk.message.content,
        };
      }
    }
  }

  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.ollamaModelId || '',
      info: openAiModelInfoSaneDefaults,
    };
  }
}
