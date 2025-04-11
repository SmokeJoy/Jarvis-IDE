import type { ApiProvider, StreamHandler } from '../ApiProvider.js';
import type { ChatMessage, normalizeChatMessages } from '../../../types/ChatMessage.js';
import { Logger } from '../../../utils/logger.js';

export class TogetherProvider implements ApiProvider {
  readonly id = 'together';
  readonly label = 'Together AI';
  
  /**
   * Verifica se il provider supporta lo streaming
   */
  isStreamable(): boolean {
    return true;
  }
  
  /**
   * Effettua una chiamata in streaming all'API di Together
   */
  async streamChat(
    messages: ChatMessage[],
    apiKey: string,
    endpoint?: string,
    handler?: StreamHandler
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('API key non specificata per Together AI');
    }
    
    Logger.info('Invio richiesta streaming a Together AI');
    
    try {
      // URL dell'API, usa l'endpoint specificato o quello predefinito
      const apiUrl = endpoint || 'https://api.together.xyz/v1/completions';
      
      // Prepara l'header di autenticazione
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      
      // Normalizza i messaggi al formato standard
      const normalizedMessages = normalizeChatMessages(messages);
      
      // Converti i messaggi nel formato richiesto da Together AI
      const prompt = this.formatMessagesForTogether(normalizedMessages);
      
      // Prepara il corpo della richiesta
      const body = JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.2', // Modello predefinito
        prompt: prompt,
        stream: true,
        temperature: 0.2,
        max_tokens: 4096
      });
      
      // Effettua la richiesta fetch
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API Together: ${response.status} - ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error('La risposta non contiene uno stream');
      }
      
      // Gestisci la risposta in streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const jsonData = JSON.parse(line.substring(6));
            
            if (jsonData.choices && jsonData.choices[0]?.text) {
              const token = jsonData.choices[0].text;
              
              // Aggiunge il token alla risposta accumulata
              accumulatedResponse += token;
              
              // Notifica il token attraverso il handler
              if (handler?.onToken) {
                handler.onToken(token);
              }
            }
          } catch (e) {
            // Ignora le linee che non possono essere parse come JSON
            continue;
          }
        }
      }
      
      // Notifica il completamento attraverso il handler
      if (handler?.onComplete) {
        handler.onComplete(accumulatedResponse);
      }
      
      return accumulatedResponse;
    } catch (error) {
      Logger.error(`Errore durante la richiesta streaming a Together: ${error.message}`);
      
      // Notifica l'errore attraverso il handler
      if (handler?.onError) {
        handler.onError(error);
      }
      
      throw error;
    }
  }
  
  /**
   * Effettua una chiamata non-streaming all'API di Together
   */
  async chat(
    messages: ChatMessage[],
    apiKey: string,
    endpoint?: string
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('API key non specificata per Together AI');
    }
    
    Logger.info('Invio richiesta non-streaming a Together AI');
    
    try {
      // URL dell'API, usa l'endpoint specificato o quello predefinito
      const apiUrl = endpoint || 'https://api.together.xyz/v1/completions';
      
      // Prepara l'header di autenticazione
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      
      // Normalizza i messaggi al formato standard
      const normalizedMessages = normalizeChatMessages(messages);
      
      // Converti i messaggi nel formato richiesto da Together AI
      const prompt = this.formatMessagesForTogether(normalizedMessages);
      
      // Prepara il corpo della richiesta
      const body = JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.2', // Modello predefinito
        prompt: prompt,
        temperature: 0.2,
        max_tokens: 4096
      });
      
      // Effettua la richiesta fetch
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API Together: ${response.status} - ${errorText}`);
      }
      
      const responseJson = await response.json();
      
      if (responseJson.choices && responseJson.choices[0]?.text) {
        return responseJson.choices[0].text;
      } else {
        throw new Error('Formato di risposta Together non valido');
      }
    } catch (error) {
      Logger.error(`Errore durante la richiesta non-streaming a Together: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Formatta i messaggi nel formato richiesto da Together AI
   * @param messages Array di messaggi da formattare
   * @returns Stringa formattata per l'API di Together
   */
  private formatMessagesForTogether(messages: ChatMessage[]): string {
    let prompt = '';
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `<system>\n${message.content}\n</system>\n\n`;
          break;
        case 'user':
          prompt += `<human>\n${message.content}\n</human>\n\n`;
          break;
        case 'assistant':
          prompt += `<assistant>\n${message.content}\n</assistant>\n\n`;
          break;
      }
    }
    
    // Aggiungi il delimitatore finale per segnalare che è il turno dell'assistente
    prompt += '<assistant>\n';
    
    return prompt;
  }
} 