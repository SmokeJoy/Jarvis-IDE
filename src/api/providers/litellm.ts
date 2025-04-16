import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI, { ChatCompletionMessageParam } from 'openai';
import { ApiHandlerOptions, ModelInfo } from '../../src/shared/types/api.types';
import { ApiHandlerOptions as ApiHandlerOptionsTs } from '../../src/shared/types/api.types';
import { liteLlmDefaultModelId, liteLlmModelInfoSaneDefaults } from '../../shared/api';
import { ApiHandler } from '../index';
import { ApiStream } from '../../src/shared/types/api.types';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { logger } from '../../utils/logger';
import { openAiModelInfoSaneDefaults } from '../../shared/api';
import { createChatMessage } from '../../src/shared/types/chat.types';

export class LiteLlmHandler implements ApiHandler {
  private options: ApiHandlerOptions;
  private client: OpenAI;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new OpenAI({
      baseURL: this.options.liteLlmBaseUrl || 'http://localhost:4000',
      apiKey: this.options.liteLlmApiKey || 'noop',
    });
    logger.debug(
      `[LiteLlmHandler] Inizializzato con API key: ${this.options.liteLlmApiKey ? '***' : 'non fornita'}`
    );
  }

  async calculateCost(
    prompt_tokens: number,
    completion_tokens: number
  ): Promise<number | undefined> {
    // Reference: https://github.com/BerriAI/litellm/blob/122ee634f434014267af104814022af1d9a0882f/litellm/proxy/spend_tracking/spend_management_endpoints.py#L1473
    const modelId = this.options.liteLlmModelId || liteLlmDefaultModelId;
    try {
      const response = await fetch(`${this.client.baseURL}/spend/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.liteLlmApiKey}`,
        },
        body: JSON.stringify({
          completion_response: {
            model: modelId,
            usage: {
              prompt_tokens,
              completion_tokens,
            },
          },
        }),
      });

      if (response.ok) {
        const data: { cost: number } = await response.json();
        return data.cost;
      } else {
        logger.error(`[LiteLlmHandler] Errore nel calcolo del costo: ${response.statusText}`);
        return undefined;
      }
    } catch (error) {
      logger.error(
        `[LiteLlmHandler] Errore nel calcolo del costo: ${error instanceof Error ? error.message : String(error)}`
      );
      return undefined;
    }
  }

  async *createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    const formattedMessages = convertToOpenAiMessages(messages);
    const systemMessage: ChatCompletionMessageParam = createChatMessage({role: 'system', content: systemPrompt,
        timestamp: Date.now()
    });
    const modelId = this.options.liteLlmModelId || liteLlmDefaultModelId;
    const isOminiModel = modelId.includes('o1-mini') || modelId.includes('o3-mini');
    let temperature: number | undefined = 0;

    if (isOminiModel) {
      temperature = undefined; // does not support temperature
    }

    logger.info(`[LiteLlmHandler] Inizio chiamata API LiteLLM con modello: ${modelId}`);

    try {
      const stream = await this.client.chat.completions.create({
        model: this.options.liteLlmModelId || liteLlmDefaultModelId,
        messages: [systemMessage, ...formattedMessages],
        temperature,
        stream: true,
        stream_options: { include_usage: true },
      });

      const inputCost = (await this.calculateCost(1e6, 0)) || 0;
      const outputCost = (await this.calculateCost(0, 1e6)) || 0;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          yield {
            type: 'text',
            text: delta.content,
          };
        }

        if (chunk.usage) {
          const totalCost =
            (inputCost * chunk.usage.prompt_tokens) / 1e6 +
            (outputCost * chunk.usage.completion_tokens) / 1e6;
          yield {
            type: 'usage',
            inputTokens: chunk.usage.prompt_tokens || 0,
            outputTokens: chunk.usage.completion_tokens || 0,
            totalCost,
          };
        }
      }
    } catch (error) {
      logger.error(
        `[LiteLlmHandler] Errore durante la chiamata API: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  getModel() {
    return {
      id: this.options.liteLlmModelId || liteLlmDefaultModelId,
      info: liteLlmModelInfoSaneDefaults,
    };
  }
}
