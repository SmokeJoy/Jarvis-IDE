import type { ApiProvider, StreamHandler } from '../ApiProvider.js';
import type { ChatMessage, normalizeChatMessages } from '../../../types/ChatMessage.js';
import { Logger } from '../../../utils/logger.js';

export class OpenRouterProvider implements ApiProvider {
  readonly id = 'openrouter';
  readonly label = 'OpenRouter';
  
  /**
   * Verifica se il provider supporta lo streaming
   */
  isStreamable(): boolean {
    return true;
  }
  
  /**
   * Effettua una chiamata in streaming all'API di OpenRouter
   */
  async streamChat(
    messages: ChatMessage[],
    apiKey: string,
    endpoint?: string,
    handler?: StreamHandler
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('API key non specificata per OpenRouter');
    }
    
    Logger.info('Invio richiesta streaming a OpenRouter');
    
    try {
      const apiUrl = endpoint || 'https://openrouter.ai/api/v1/chat/completions';
      
      // Normalizza i messaggi al formato standard
      const normalizedMessages = normalizeChatMessages(messages);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://jarvis-ide.dev',
        'X-Title': 'Jarvis IDE Agent'
      };
      
      const body = JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: normalizedMessages.map(({ role, content }) => ({ role, content })),
        stream: true,
        temperature: 0.2,
        max_tokens: 4096
      });
      
      const response = await fetch(apiUrl, { method: 'POST', headers, body });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API OpenRouter: ${response.status} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('La risposta non contiene uno stream');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() && !line.includes('[DONE]'));
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const jsonData = JSON.parse(line.slice(6));
            const token = jsonData?.choices?.[0]?.delta?.content;
            if (token) {
              accumulatedResponse += token;
              handler?.onToken?.(token);
            }
          } catch (e) {
            // Ignora le linee che non possono essere parse come JSON
            continue;
          }
        }
      }
      
      handler?.onComplete?.(accumulatedResponse);
      return accumulatedResponse;
    } catch (error) {
      Logger.error(`Errore durante la richiesta streaming a OpenRouter: ${error.message}`);
      
      // Notifica l'errore attraverso l'handler
      if (handler?.onError) {
        handler.onError(error);
      }
      
      throw error;
    }
  }
  
  /**
   * Effettua una chiamata non-streaming all'API di OpenRouter
   */
  async chat(
    messages: ChatMessage[],
    apiKey: string,
    endpoint?: string
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('API key non specificata per OpenRouter');
    }
    
    Logger.info('Invio richiesta non-streaming a OpenRouter');
    
    try {
      const apiUrl = endpoint || 'https://openrouter.ai/api/v1/chat/completions';
      
      // Normalizza i messaggi al formato standard
      const normalizedMessages = normalizeChatMessages(messages);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://jarvis-ide.dev',
        'X-Title': 'Jarvis IDE Agent'
      };
      
      const body = JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: normalizedMessages.map(({ role, content }) => ({ role, content })),
        temperature: 0.2,
        max_tokens: 4096
      });
      
      const response = await fetch(apiUrl, { method: 'POST', headers, body });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API OpenRouter: ${response.status} - ${errorText}`);
      }
      
      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Formato di risposta OpenRouter non valido');
      }
      
      return content;
    } catch (error) {
      Logger.error(`Errore durante la richiesta non-streaming a OpenRouter: ${error.message}`);
      throw error;
    }
  }
} 