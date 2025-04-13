import { ApiHandler } from '../index';
import { ApiHandlerOptions, ModelInfo } from '../../shared/types/api.types';
import { calculateApiCostOpenAI } from '../../utils/cost';
import { convertToOpenAiMessages } from '../transform/openai-format';
import { ApiStream, ApiStreamChunk } from '../transform/stream';
import { convertToR1Format } from '../transform/r1-format';
import { BaseStreamHandler } from '../handlers/BaseStreamHandler';
import { logger } from '../../utils/logger';
import { createSafeMessage } from "../../shared/types/message";

interface GroqUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export class GroqHandler extends BaseStreamHandler implements ApiHandler {
  private client: OpenAI;

  constructor(options: ApiHandlerOptions) {
    super(options);
    this.client = new OpenAI({
      baseURL: 'https://api.groq.com/v1',
      apiKey: this.options.groqApiKey,
    });
    logger.debug(
      `[GroqHandler] Inizializzato con API key: ${this.options.groqApiKey ? '***' : 'non fornita'}`
    );
  }

  protected async fetchAPIResponse(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): Promise<Stream<ChatCompletionChunk>> {
    const model = this.getModel();

    logger.info(`[GroqHandler] Preparazione richiesta per modello: ${model.id}`);

    const openAiMessages: ChatCompletionMessageParam[] = [
      createSafeMessage({role: 'system', content: systemPrompt}),
      ...convertToOpenAiMessages(messages),
    ];

    logger.info(`[GroqHandler] Inizio chiamata API Groq con ${openAiMessages.length} messaggi`);

    try {
      const response = await this.client.chat.completions.create({
        model: model.id,
        messages: openAiMessages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0,
      });

      logger.info(`[GroqHandler] Risposta API Groq ricevuta correttamente`);
      return response;
    } catch (error) {
      logger.error(
        `[GroqHandler] Errore durante la chiamata API Groq: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  protected convertToStream(
    stream: Stream<ChatCompletionChunk>
  ): AsyncIterable<ChatCompletionChunk> {
    logger.debug(`[GroqHandler] Conversione risposta in stream`);
    return stream;
  }

  async *createMessage(
    systemPrompt: string,
    messages: Anthropic.Messages.MessageParam[]
  ): ApiStream {
    logger.info(`[GroqHandler] Creazione messaggio con modello ${this.getModel().id}`);

    const rawStream = await this.getStream(systemPrompt, messages);

    logger.debug(`[GroqHandler] Stream ottenuto, inizio trasformazione in ApiStream`);

    const apiStream = this.transformToApiStream(rawStream, (chunk) => {
      const results: ApiStreamChunk[] = [];

      if ('choices' in chunk && Array.isArray(chunk.choices) && chunk.choices.length > 0) {
        const delta = chunk.choices[0]?.delta ?? {};

        if (delta && typeof delta === 'object' && 'content' in delta && delta.content) {
          results.push({
            type: 'text',
            text: delta.content,
          });
        }
      }

      if (chunk && 'usage' in chunk && chunk.usage) {
        const model = this.getModel();
        const groqUsage = chunk.usage as GroqUsage;

        const inputTokens = groqUsage?.prompt_tokens || 0;
        const outputTokens = groqUsage?.completion_tokens || 0;
        const totalCost = calculateApiCostOpenAI(model.info, inputTokens, outputTokens);

        logger.debug(
          `[GroqHandler] Informazioni di utilizzo: input=${inputTokens}, output=${outputTokens}, costo=${totalCost}`
        );

        results.push({
          type: 'usage',
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          totalCost: totalCost,
        });
      }

      return results;
    });

    yield* apiStream;
  }

  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.groqModelId ?? 'mixtral-8x7b-32768',
      info: {
        maxTokens: 32768,
        temperature: 0,
      },
    };
  }
}
