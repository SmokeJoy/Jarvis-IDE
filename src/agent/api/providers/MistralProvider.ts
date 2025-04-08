import { ApiProvider, StreamHandler } from '../ApiProvider.js';
import { ChatMessage } from '../../../types/ChatMessage.js';
import { MistralTransformer } from '../../../api/transform/mistral-format.js';
import { logger } from '../../../utils/logger.js';

/**
 * Provider per Mistral AI API
 */
export class MistralProvider implements ApiProvider {
  readonly id = 'mistral';
  readonly label = 'Mistral AI';
  
  /**
   * Verifica se il provider supporta lo streaming
   */
  isStreamable(): boolean {
    return true; // Mistral supporta nativamente lo streaming
  }

  /**
   * Chat standard (non streaming)
   */
  async chat(
    messages: ChatMessage[],
    apiKey: string,
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
    const url = baseUrl || 'https://api.mistral.ai/v1/chat/completions';
    const mistralMessages = MistralTransformer.toLLMMessages(messages, systemPrompt);

    const requestBody: any = {
      model: options?.functions ? 'mistral-large-latest' : 'mistral-medium-latest', // Default model
      messages: mistralMessages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2048
    };

    // Aggiungi tool se disponibili
    if (options?.functions?.length) {
      requestBody.tools = options.functions.map(func => ({
        type: 'function',
        function: {
          name: func.name,
          description: func.description || '',
          parameters: func.parameters
        }
      }));
    }

    logger.debug('[MistralProvider] Invio richiesta chat', { url, requestBody });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Errore Mistral API: ${res.status} - ${error}`);
      }

      const data = await res.json();
      logger.debug('[MistralProvider] Risposta ricevuta', { data });

      return MistralTransformer.fromLLMResponse(data);
    } catch (err) {
      logger.error('[MistralProvider] Errore durante la chat', { err });
      throw err;
    }
  }

  /**
   * Chat in streaming (supportato nativamente da Mistral)
   */
  async streamChat(
    messages: ChatMessage[],
    apiKey: string,
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
    const url = baseUrl || 'https://api.mistral.ai/v1/chat/completions';
    const mistralMessages = MistralTransformer.toLLMMessages(messages, systemPrompt);

    const requestBody: any = {
      model: options?.functions ? 'mistral-large-latest' : 'mistral-medium-latest',
      messages: mistralMessages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2048,
      stream: true
    };

    // Aggiungi tool se disponibili
    if (options?.functions?.length) {
      requestBody.tools = options.functions.map(func => ({
        type: 'function',
        function: {
          name: func.name,
          description: func.description || '',
          parameters: func.parameters
        }
      }));
    }

    logger.debug('[MistralProvider] Invio richiesta streaming', { url, requestBody });
    let fullResponse = '';
    let completionContent = '';
    let toolUseId = '';
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const error = await res.text();
        const errorMessage = `Errore Mistral API: ${res.status} - ${error}`;
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

            if (delta?.content) {
              const content = delta.content;
              fullResponse += content;
              completionContent += content;
              handler?.onToken?.(content);
            } 
            
            // Gestione tool use
            if (delta?.tool_calls && delta.tool_calls.length > 0) {
              const toolCall = delta.tool_calls[0];
              
              if (toolCall.type === 'function') {
                if (toolCall.function?.name) {
                  toolUseId = toolCall.id;
                  const toolUseJson = JSON.stringify({
                    id: toolCall.id,
                    type: 'function',
                    function: {
                      name: toolCall.function.name,
                      arguments: toolCall.function.arguments || '{}'
                    }
                  });
                  
                  fullResponse += `\n[TOOL_USE: ${toolUseJson}]\n`;
                  handler?.onToken?.(`\n[TOOL_USE: ${toolUseJson}]\n`);
                }
              }
            }
          } catch (e) {
            logger.error('[MistralProvider] Errore parsing chunk', { chunk, error: e });
            continue;
          }
        }
      }

      handler?.onComplete?.(fullResponse);
      return fullResponse;
    } catch (err) {
      logger.error('[MistralProvider] Errore durante lo streaming', { err });
      handler?.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }
} 