import type { ApiProvider, ProviderOptions } from './base.js.js';
import type { ChatCompletionOptions, ChatCompletion, LLMProviderId, StreamChunk } from '../../types/global.js.js';
import type { ModelInfo } from '../../shared/types/api.types.js.js';
import { Logger } from '../../utils/logger.js.js';
import OpenAI from 'openai';

/**
 * Provider per SambaNova
 */
export class SambanovaProvider implements ApiProvider {
  // Identificatore del provider
  readonly id: LLMProviderId = 'sambanova';
  
  // Supporta lo streaming
  readonly supportsStream: boolean = true;
  
  // Client OpenAI (compatibile con SambaNova)
  private client: OpenAI;
  
  // Opzioni di configurazione
  private options: ProviderOptions;
  
  constructor(options: ProviderOptions) {
    this.options = options;
    
    this.client = new OpenAI({
      baseURL: 'https://api.sambanova.ai/v1',
      apiKey: this.options.apiKey,
    });
    
    Logger.info('Inizializzato provider SambaNova');
  }
  
  /**
   * Genera una risposta in streaming usando l'API di SambaNova
   */
  async *streamChat(options: ChatCompletionOptions): AsyncGenerator<StreamChunk> {
    const maxRetries = 2;
    const retryDelay = 500;
    let attempt = 0;
    
    while (true) {
      try {
        attempt++;
        const modelId = options.model || this.options.modelId || 'llama-7b';
        
        // Converte i messaggi nel formato corretto
        const messages = this.formatMessages(options);
        
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
        Logger.error(`[sambanova] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error);
        if (attempt > maxRetries) {
          Logger.error(`[sambanova] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`, error);
          yield {
            type: 'error',
            text: `Errore: ${error}`
          };
          break;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
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
        const modelId = options.model || this.options.modelId || 'llama-7b';
        
        // Converte i messaggi nel formato corretto
        const messages = this.formatMessages(options);
        
        const response = await this.client.chat.completions.create({
          model: modelId,
          messages: messages,
          temperature: options.temperature || 0,
        });
        
        return {
          text: response.choices[0]?.message?.content || '',
          usage: {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0
          }
        };
      } catch (error) {
        Logger.error(`[sambanova] Tentativo ${attempt}/${maxRetries + 1} fallito:`, error);
        if (attempt > maxRetries) {
          Logger.error(`[sambanova] Numero massimo di tentativi raggiunto (${maxRetries + 1}). Errore:`, error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // Questa linea non sarà mai raggiunta, ma TypeScript richiede un valore di ritorno
    throw new Error('Errore imprevisto');
  }
  
  /**
   * Formatta i messaggi per l'API di SambaNova
   */
  private formatMessages(options: ChatCompletionOptions): any[] {
    const messages = [];
    
    // Aggiungi il prompt di sistema
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    // Aggiungi i messaggi
    for (const msg of options.messages) {
      messages.push({
        role: msg.role === 'function' ? 'assistant' : msg.role,
        content: msg.content
      });
    }
    
    return messages;
  }
  
  /**
   * Restituisce informazioni sul modello
   */
  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.modelId || 'llama-7b',
      info: {
        supportsPromptCache: false,
        name: this.options.modelId || 'llama-7b',
        context_length: 8192,
        maxTokens: 4096,
        description: 'Modello SambaNova'
      }
    };
  }
} 