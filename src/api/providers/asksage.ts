import { Anthropic } from '@anthropic-ai/sdk';
import { ApiHandler } from '..';
import {
  AskSageModelId,
  askSageModels,
  askSageDefaultModelId,
  askSageDefaultURL,
} from '../../shared/api';
import { ApiHandlerOptions, ModelInfo } from '../../src/shared/types/api.types';
import { ApiStream } from '../transform/stream';

type AskSageRequest = {
  system_prompt: string;
  message: {
    user: 'gpt' | 'me';
    message: string;
  }[];
  model: string;
  dataset: 'none';
};

type AskSageResponse = {
  uuid: string;
  status: number;
  // Response status
  response: string;
  // Generated response message
  message: string;
};

export class AskSageHandler implements ApiHandler {
  private options: ApiHandlerOptions;
  private apiUrl: string;
  private apiKey: string;

  constructor(options: ApiHandlerOptions) {
    console.log('init api url', options.asksageApiUrl, askSageDefaultURL);
    this.options = options;
    this.apiKey = options.asksageApiKey || '';
    this.apiUrl = options.asksageApiUrl || askSageDefaultURL;

    if (!this.apiKey) {
      throw new Error('AskSage API key is required');
    }
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

        // Transform messages into AskSageRequest format
        const formattedMessages = messages.map((msg) => {
          const content = Array.isArray(msg.content)
            ? msg.content.map((block) => ('text' in block ? block.text : '')).join('')
            : msg.content;

          return {
            user: msg.role === 'assistant' ? ('gpt' as const) : ('me' as const),
            message: content,
          };
        });

        const request: AskSageRequest = {
          system_prompt: systemPrompt,
          message: formattedMessages,
          model: model.id,
          dataset: 'none',
        };

        // Make request to AskSage API
        const response = await fetch(`${this.apiUrl}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-access-tokens': this.apiKey,
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`AskSage API error: ${error}`);
        }

        const result = (await response.json()) as AskSageResponse;

        if (!result.message) {
          throw new Error('No content in AskSage response');
        }

        // Return entire response as a single chunk since streaming is not supported
        yield {
          type: 'text',
          text: result.message,
        };

        break; // Se arriviamo qui, il metodo è riuscito e usciamo dal ciclo
      } catch (error) {
        console.error(`[asksage] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error);
        if (attempt > maxRetries) {
          console.error(
            `[asksage] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`,
            error
          );
          if (error instanceof Error) {
            throw new Error(`AskSage request failed: ${error.message}`);
          } else {
            throw new Error(`AskSage request failed with unknown error`);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  getModel(): { id: string; info: ModelInfo } {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in askSageModels) {
      const id = modelId as AskSageModelId;
      return { id, info: askSageModels[id] };
    }
    return {
      id: askSageDefaultModelId,
      info: askSageModels[askSageDefaultModelId],
    };
  }
}
