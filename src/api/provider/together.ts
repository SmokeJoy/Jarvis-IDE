import { ApiProvider, ProviderOptions } from './base';
import {
  ChatCompletionOptions,
  ChatCompletion,
  LLMProviderId,
  StreamChunk,
} from '../../types/global';
import { ModelInfo } from '../../shared/types/api.types';
import { Logger } from '../../utils/logger';
import OpenAI from 'openai';
import { createSafeMessage } from "../../shared/types/message";

/**
 * Provider per Together.ai
 */
export class TogetherProvider implements ApiProvider {
  // Identificatore del provider
  readonly id: LLMProviderId = 'together';

  // Supporta lo streaming
  readonly supportsStream: boolean = true;

  // Client OpenAI (compatibile con Together.ai)
  private client: OpenAI;

  // Opzioni di configurazione
  private options: ProviderOptions;

  constructor(options: ProviderOptions) {
    this.options = options;

    this.client = new OpenAI({
      baseURL: 'https://api.together.xyz/v1',
      apiKey: this.options.apiKey,
    });

    Logger.info('Inizializzato provider Together.ai');
  }

  /**
   * Genera una risposta in streaming usando l'API di Together.ai
   */
  async *streamChat(options: ChatCompletionOptions): AsyncGenerator<StreamChunk> {
    const maxRetries = 2;
    const retryDelay = 500;
    let attempt = 0;

    while (true) {
      try {
        attempt++;
        const modelId = options.model || this.options.modelId || '';
        const isDeepseekReasoner = modelId.includes('deepseek-reasoner');

        // Converte i messaggi nel formato corretto
        const messages = this.formatMessages(options, isDeepseekReasoner);

        const stream = await this.client.chat.completions.create({
          model: modelId,
          messages: messages,
          temperature: options.temperature || 0,
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

        // Se arriviamo qui, il metodo è riuscito e usciamo dal ciclo
        break;
      } catch (error) {
        Logger.error(`[together] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error);
        if (attempt > maxRetries) {
          Logger.error(
            `[together] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`,
            error
          );
          yield {
            type: 'error',
            text: `Errore: ${error}`,
          };
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Genera una risposta completa (non in streaming)
   */
  async chat(options: ChatCompletionOptions): Promise<ChatCompletion> {
    const maxRetries = 2;
    const retryDelay = 500;
    let attempt = 0;

    while (true) {
      try {
        attempt++;
        const modelId = options.model || this.options.modelId || '';
        const isDeepseekReasoner = modelId.includes('deepseek-reasoner');

        // Converte i messaggi nel formato corretto
        const messages = this.formatMessages(options, isDeepseekReasoner);

        const response = await this.client.chat.completions.create({
          model: modelId,
          messages: messages,
          temperature: options.temperature || 0,
        });

        let text = response.choices[0]?.message?.content || '';

        // Estrai il ragionamento se presente (per DeepSeek Reasoner)
        if (isDeepseekReasoner && response.choices[0]?.message?.content_fields?.reasoning) {
          text = `Reasoning: ${response.choices[0].message.content_fields.reasoning}\n\nAnswer: ${text}`;
        }

        return {
          text,
          usage: {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
          },
        };
      } catch (error) {
        Logger.error(`[together] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error);
        if (attempt > maxRetries) {
          Logger.error(
            `[together] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`,
            error
          );
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    // Questa linea non sarà mai raggiunta, ma TypeScript richiede un valore di ritorno
    throw new Error('Errore imprevisto');
  }

  /**
   * Formatta i messaggi per l'API di Together.ai
   * @param options Opzioni di completamento
   * @param isDeepseekReasoner Se true, utilizza il formato specifico per DeepSeek Reasoner
   */
  private formatMessages(options: ChatCompletionOptions, isDeepseekReasoner: boolean): any[] {
    const messages = [];

    // Aggiungi il prompt di sistema
    if (options.systemPrompt) {
      messages.push(createSafeMessage({role: 'system', content: options.systemPrompt}));
    }

    // Aggiungi i messaggi
    for (const msg of options.messages) {
      if (isDeepseekReasoner && msg.role === 'user') {
        // Per DeepSeek Reasoner, formatta i messaggi utente in modo speciale
        messages.push(createSafeMessage({role: 'user', content: msg.content}));
      } else {
        messages.push(createSafeMessage({role: msg.role === 'function' ? 'assistant' : msg.role, content: msg.content}));
      }
    }

    return messages;
  }

  /**
   * Restituisce informazioni sul modello
   */
  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.modelId || '',
      info: {
        supportsPromptCache: false,
        name: this.options.modelId || '',
        context_length: 16384,
        maxTokens: 4096,
        description: 'Modello Together.ai',
      },
    };
  }
}
