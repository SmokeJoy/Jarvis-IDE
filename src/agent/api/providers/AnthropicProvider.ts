import type { ApiProvider, StreamHandler } from '../ApiProvider.js.js';
import type { ChatMessage } from '../../../types/ChatMessage.js.js';
import { AnthropicTransformer } from '../../../api/transform/anthropic-format.js.js';
import type { ApiConfiguration } from '../../../shared/types/api.types.js.js';
import { logger } from '../../../utils/logger.js.js';

/**
 * Provider per Anthropic (Claude)
 */
export class AnthropicProvider implements ApiProvider {
  /**
   * Effettua una chiamata standard (non streaming) all'API di Anthropic
   *
   * @param messages I messaggi da inviare
   * @param apiKey La chiave API di Anthropic
   * @param baseUrl L'URL base opzionale (non usato per Anthropic standard)
   * @param systemPrompt Il prompt di sistema opzionale
   * @returns La risposta del modello in formato standardizzato
   */
  async chat(
    messages: ChatMessage[],
    apiKey: string,
    baseUrl?: string,
    systemPrompt?: string
  ): Promise<ChatMessage> {
    const anthropicMessages = AnthropicTransformer.toLLMMessages(messages);
    const url = baseUrl || 'https://api.anthropic.com/v1/messages';
    
    const requestBody = {
      model: 'claude-3-opus-20240229', // Modello di default
      messages: anthropicMessages,
      max_tokens: 4096
    };
    
    // Aggiungi il system prompt se fornito
    if (systemPrompt) {
      requestBody['system'] = systemPrompt;
    }

    // TASK 1: Supporto Tool Use - aggiungi tools se disponibili
    if (messages[0]?.functions?.length > 0) {
      requestBody['tools'] = messages[0].functions.map((f) => ({
        name: f.name,
        description: f.description,
        input_schema: f.parameters // già generato in formato JSON Schema
      }));
    }

    // TASK 3: Controllo immagini troppo grandi
    requestBody.messages = requestBody.messages.map((msg: any) => {
      if (!Array.isArray(msg.content)) return msg;

      const filteredContent = msg.content.filter((part: any) => {
        if (part.type === 'image' && part.source?.type === 'base64') {
          const size = part.source.data?.length || 0;
          if (size > 10_000_000) {
            logger.warn('[AnthropicProvider] Immagine base64 troppo grande, ignorata');
            return false;
          }
        }
        return true;
      });

      return { ...msg, content: filteredContent };
    });

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };

    logger.debug('[AnthropicProvider] Invio richiesta chat', { 
      url,
      modelName: requestBody.model,
      messageCount: requestBody.messages.length
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API Anthropic: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      logger.debug('[AnthropicProvider] Risposta ricevuta', { responseId: data.id });
      
      return AnthropicTransformer.fromLLMResponse(data);
    } catch (error) {
      logger.error('[AnthropicProvider] Errore durante la chiamata API', { error });
      throw error;
    }
  }

  /**
   * Effettua una chiamata streaming all'API di Anthropic
   *
   * @param messages I messaggi da inviare
   * @param apiKey La chiave API di Anthropic
   * @param baseUrl L'URL base opzionale
   * @param handler Gestore degli eventi di streaming
   * @param systemPrompt Il prompt di sistema opzionale
   */
  async streamChat(
    messages: ChatMessage[],
    apiKey: string,
    baseUrl: string,
    handler: StreamHandler,
    systemPrompt?: string
  ): Promise<void> {
    const anthropicMessages = AnthropicTransformer.toLLMMessages(messages);
    const url = baseUrl || 'https://api.anthropic.com/v1/messages';
    
    const requestBody = {
      model: 'claude-3-opus-20240229', // Modello di default
      messages: anthropicMessages,
      max_tokens: 4096,
      stream: true
    };
    
    // Aggiungi il system prompt se fornito
    if (systemPrompt) {
      requestBody['system'] = systemPrompt;
    }

    // TASK 1: Supporto Tool Use - aggiungi tools se disponibili
    if (messages[0]?.functions?.length > 0) {
      requestBody['tools'] = messages[0].functions.map((f) => ({
        name: f.name,
        description: f.description,
        input_schema: f.parameters // già generato in formato JSON Schema
      }));
    }

    // TASK 3: Controllo immagini troppo grandi
    requestBody.messages = requestBody.messages.map((msg: any) => {
      if (!Array.isArray(msg.content)) return msg;

      const filteredContent = msg.content.filter((part: any) => {
        if (part.type === 'image' && part.source?.type === 'base64') {
          const size = part.source.data?.length || 0;
          if (size > 10_000_000) {
            logger.warn('[AnthropicProvider] Immagine base64 troppo grande, ignorata');
            return false;
          }
        }
        return true;
      });

      return { ...msg, content: filteredContent };
    });

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };

    logger.debug('[AnthropicProvider] Avvio streamChat', { 
      url,
      modelName: requestBody.model,
      messageCount: requestBody.messages.length
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API Anthropic: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body stream non disponibile');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        // Elabora le linee complete nel buffer
        let lineEnd;
        while ((lineEnd = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, lineEnd);
          buffer = buffer.slice(lineEnd + 1);
          
          if (line.startsWith('data: ')) {
            const jsonData = line.slice(6);
            
            // Gestisci il caso di [DONE] che indica la fine dello stream
            if (jsonData.trim() === '[DONE]') {
              handler.onComplete();
              continue;
            }
            
            try {
              const chunk = JSON.parse(jsonData);
              const text = AnthropicTransformer.extractTextFromChunk(chunk);
              
              if (text) {
                handler.onToken(text);
              }

              // TASK 2: Decodifica avanzata degli stream per tool_use/tool_result
              if (chunk?.delta?.type === 'tool_use') {
                handler.onToolCall?.({
                  id: chunk.delta.id,
                  name: chunk.delta.name,
                  arguments: chunk.delta.input
                });
              }

              if (chunk?.delta?.type === 'tool_result') {
                handler.onToolResult?.({
                  tool_use_id: chunk.delta.tool_use_id,
                  content: chunk.delta.content,
                  is_error: chunk.delta.is_error
                });
              }
            } catch (e) {
              logger.error('[AnthropicProvider] Errore parsing chunk', { 
                error: e, 
                jsonData 
              });
            }
          }
        }
      }
      
      // Gestisci eventuale buffer rimanente
      if (buffer.trim().length > 0) {
        logger.debug('[AnthropicProvider] Buffer rimanente dopo stream', { buffer });
      }
      
      handler.onComplete();
    } catch (error) {
      logger.error('[AnthropicProvider] Errore durante lo streaming', { error });
      handler.onError(error as Error);
    }
  }
} 