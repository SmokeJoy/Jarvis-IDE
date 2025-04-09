import type { ApiProvider, StreamHandler } from '../ApiProvider.js.js';
import type { ChatMessage } from '../../../types/ChatMessage.js.js';
import { LLMStudioTransformer } from '../../../api/transform/llmstudio-format.js.js';
import { logger } from '../../../utils/logger.js.js';

/**
 * Provider per LLM Studio (modelli locali con interfaccia compatibile OpenAI)
 */
export class LLMStudioProvider implements ApiProvider {
  readonly id = 'lmstudio';
  readonly label = 'LLM Studio';
  
  /**
   * Verifica se il provider supporta lo streaming
   */
  isStreamable(): boolean {
    return true; // LLM Studio supporta lo streaming come OpenAI
  }

  /**
   * Rileva i modelli disponibili in LLM Studio
   * @param baseUrl URL base di LLM Studio
   * @returns Array di ID dei modelli disponibili
   */
  async detectAvailableModels(baseUrl: string = 'http://localhost:1234'): Promise<string[]> {
    try {
      const url = `${baseUrl}/v1/models`;
      logger.debug('[LLMStudioProvider] Rilevamento modelli disponibili', { url });

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        logger.warn('[LLMStudioProvider] Impossibile rilevare i modelli disponibili', { 
          status: res.status,
          statusText: res.statusText
        });
        return [];
      }

      const data = await res.json();
      const modelIds = data.data?.map((model: any) => model.id) || [];
      
      logger.debug('[LLMStudioProvider] Modelli disponibili rilevati', { modelIds });
      return modelIds;
    } catch (err) {
      logger.warn('[LLMStudioProvider] Errore nel rilevamento dei modelli', { err });
      return [];
    }
  }

  /**
   * Ottiene un modello appropriato basato sui modelli disponibili o un fallback
   * @param availableModels Modelli disponibili
   * @param isFunctionCall Se true, preferisce modelli adatti a function calling
   * @returns ID del modello da utilizzare
   */
  getAppropriateModel(availableModels: string[] = [], isFunctionCall: boolean = false): string {
    // Priorità per function calling
    const functionCallingPreference = [
      'deepseek-coder-instruct',
      'deepseek-coder-6.7b',
      'deepseek-coder',
      'llama3-8b-instruct',
      'llama-3-8b-instruct',
      'codellama-7b',
      'mistral-7b-instruct',
      'mistral-7b'
    ];
    
    // Priorità generale
    const generalPreference = [
      'llama3-8b-instruct',
      'llama-3-8b-instruct',
      'mistral-7b-instruct',
      'mistral-7b',
      'deepseek-coder-6.7b',
      'codellama-7b'
    ];

    const preference = isFunctionCall ? functionCallingPreference : generalPreference;
    
    // Cerca il primo modello disponibile secondo l'ordine di preferenza
    for (const modelId of preference) {
      if (availableModels.some(m => m.includes(modelId))) {
        const matchedModel = availableModels.find(m => m.includes(modelId));
        if (matchedModel) return matchedModel;
      }
    }
    
    // Se non ci sono modelli disponibili o nessuno corrisponde, usa il fallback
    return isFunctionCall ? 'deepseek-coder-6.7b' : 'llama3-8b-instruct';
  }

  /**
   * Chat standard (non streaming)
   */
  async chat(
    messages: ChatMessage[],
    apiKey: string, // non usato per LLM Studio
    baseUrl?: string,
    systemPrompt?: string,
    options?: {
      functions?: Array<{
        name: string;
        description?: string;
        parameters: Record<string, any>;
      }>;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ChatMessage> {
    const url = baseUrl || 'http://localhost:1234/v1/chat/completions';
    const llmStudioMessages = LLMStudioTransformer.toLLMMessages(messages, systemPrompt);
    
    // Rileva i modelli disponibili
    const availableModels = await this.detectAvailableModels(baseUrl);
    const hasFunctions = options?.functions && options.functions.length > 0;
    const modelToUse = this.getAppropriateModel(availableModels, hasFunctions);

    const requestBody: any = {
      model: modelToUse,
      messages: llmStudioMessages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2048
    };

    // Aggiungi functions se disponibili (ma non tutti i modelli in LLM Studio supportano function calling)
    if (hasFunctions) {
      requestBody.functions = options.functions;
      requestBody.function_call = 'auto';
    }

    logger.debug('[LLMStudioProvider] Invio richiesta chat', { url, modelToUse, requestBody });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Errore LLM Studio: ${res.status} - ${error}`);
      }

      const data = await res.json();
      logger.debug('[LLMStudioProvider] Risposta ricevuta', { data });

      return LLMStudioTransformer.fromLLMResponse(data);
    } catch (err) {
      logger.error('[LLMStudioProvider] Errore durante la chat', { err });
      throw err;
    }
  }

  /**
   * Chat in streaming
   */
  async streamChat(
    messages: ChatMessage[],
    apiKey: string, // non usato per LLM Studio
    baseUrl?: string,
    handler?: StreamHandler,
    systemPrompt?: string,
    options?: {
      functions?: Array<{
        name: string;
        description?: string;
        parameters: Record<string, any>;
      }>;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const url = baseUrl || 'http://localhost:1234/v1/chat/completions';
    const llmStudioMessages = LLMStudioTransformer.toLLMMessages(messages, systemPrompt);
    
    // Rileva i modelli disponibili
    const availableModels = await this.detectAvailableModels(baseUrl);
    const hasFunctions = options?.functions && options.functions.length > 0;
    const modelToUse = this.getAppropriateModel(availableModels, hasFunctions);

    const requestBody: any = {
      model: modelToUse,
      messages: llmStudioMessages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2048,
      stream: true
    };

    // Aggiungi functions se disponibili
    if (hasFunctions) {
      requestBody.functions = options.functions;
      requestBody.function_call = 'auto';
    }

    logger.debug('[LLMStudioProvider] Invio richiesta streaming', { url, modelToUse, requestBody });
    let fullResponse = '';
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const error = await res.text();
        const errorMessage = `Errore LLM Studio: ${res.status} - ${error}`;
        handler?.onError?.(new Error(errorMessage));
        throw new Error(errorMessage);
      }

      if (!res.body) {
        throw new Error('Stream non supportato dal browser');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');

        for (const line of lines) {
          try {
            const cleanLine = line.replace(/^data: /, '').trim();
            if (!cleanLine || cleanLine === '[DONE]') continue;

            const data = JSON.parse(cleanLine);
            const delta = data.choices?.[0]?.delta;

            // Gestione contenuto
            if (delta?.content) {
              const content = delta.content;
              fullResponse += content;
              handler?.onToken?.(content);
            } 
            
            // Gestione function call
            if (delta?.function_call) {
              if (delta.function_call.name) {
                // Prima chiamata alla funzione, ha il nome
                fullResponse += `\n[FUNCTION_CALL: ${delta.function_call.name}(`;
                handler?.onToken?.(`\n[FUNCTION_CALL: ${delta.function_call.name}(`);
              } else if (delta.function_call.arguments) {
                // Streaming degli argomenti della funzione
                fullResponse += delta.function_call.arguments;
                handler?.onToken?.(delta.function_call.arguments);
              }
            }
          } catch (e) {
            logger.error('[LLMStudioProvider] Errore parsing chunk', { chunk, error: e });
            continue;
          }
        }
      }

      handler?.onComplete?.(fullResponse);
      return fullResponse;
    } catch (err) {
      logger.error('[LLMStudioProvider] Errore durante lo streaming', { err });
      handler?.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }
} 