import { ApiProvider, StreamHandler } from '../ApiProvider.js';
import { ChatMessage, normalizeChatMessages } from '../../../types/ChatMessage.js';
import { Logger } from '../../../utils/logger.js';

export class VertexProvider implements ApiProvider {
  readonly id = 'vertex';
  readonly label = 'Google Vertex AI';
  
  /**
   * Verifica se il provider supporta lo streaming
   */
  isStreamable(): boolean {
    return true; // Vertex AI supporta lo streaming
  }
  
  /**
   * Effettua una chiamata in streaming all'API di Vertex AI
   */
  async streamChat(
    messages: ChatMessage[],
    apiKey: string,
    endpoint?: string,
    handler?: StreamHandler
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('API key non specificata per Vertex AI');
    }
    
    Logger.info('Invio richiesta streaming a Vertex AI');
    
    try {
      // Per Vertex AI, l'endpoint dovrebbe essere l'URL completo dell'API
      const apiUrl = endpoint || 'https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/gemini-pro:streamGenerateContent';
      
      // Normalizza i messaggi al formato standard
      const normalizedMessages = normalizeChatMessages(messages);
      
      // Converti i messaggi nel formato richiesto da Vertex AI
      const vertexMessages = this.convertMessagesToVertexFormat(normalizedMessages);
      
      // Prepara l'header di autenticazione
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      
      // Prepara il corpo della richiesta
      const body = JSON.stringify({
        contents: vertexMessages,
        generation_config: {
          temperature: 0.2,
          max_output_tokens: 4096
        }
      });
      
      // Effettua la richiesta fetch
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API Vertex: ${response.status} - ${errorText}`);
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
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const jsonData = JSON.parse(line);
            
            // Estrai il testo dalla risposta Vertex
            if (jsonData.candidates && 
                jsonData.candidates[0]?.content?.parts && 
                jsonData.candidates[0].content.parts[0]?.text) {
              
              const token = jsonData.candidates[0].content.parts[0].text;
              
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
      Logger.error(`Errore durante la richiesta streaming a Vertex AI: ${error.message}`);
      
      // Notifica l'errore attraverso il handler
      if (handler?.onError) {
        handler.onError(error);
      }
      
      throw error;
    }
  }
  
  /**
   * Effettua una chiamata non-streaming all'API di Vertex AI
   */
  async chat(
    messages: ChatMessage[],
    apiKey: string,
    endpoint?: string
  ): Promise<string> {
    if (!apiKey) {
      throw new Error('API key non specificata per Vertex AI');
    }
    
    Logger.info('Invio richiesta non-streaming a Vertex AI');
    
    try {
      // Per Vertex AI, l'endpoint dovrebbe essere l'URL completo dell'API
      const apiUrl = endpoint || 'https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/gemini-pro:generateContent';
      
      // Normalizza i messaggi al formato standard
      const normalizedMessages = normalizeChatMessages(messages);
      
      // Converti i messaggi nel formato richiesto da Vertex AI
      const vertexMessages = this.convertMessagesToVertexFormat(normalizedMessages);
      
      // Prepara l'header di autenticazione
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      
      // Prepara il corpo della richiesta
      const body = JSON.stringify({
        contents: vertexMessages,
        generation_config: {
          temperature: 0.2,
          max_output_tokens: 4096
        }
      });
      
      // Effettua la richiesta fetch
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API Vertex: ${response.status} - ${errorText}`);
      }
      
      const responseJson = await response.json();
      
      // Estrai il testo dalla risposta Vertex
      if (responseJson.candidates && 
          responseJson.candidates[0]?.content?.parts && 
          responseJson.candidates[0].content.parts[0]?.text) {
        
        return responseJson.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Formato di risposta Vertex AI non valido');
      }
    } catch (error) {
      Logger.error(`Errore durante la richiesta non-streaming a Vertex AI: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Converte i messaggi dal formato ChatMessage al formato richiesto da Vertex AI
   * @param messages Array di messaggi da convertire
   * @returns Messaggi in formato Vertex AI
   */
  private convertMessagesToVertexFormat(messages: ChatMessage[]): any[] {
    const vertexMessages = [];
    let currentMessage: any = null;
    
    for (const message of messages) {
      const role = message.role === 'user' ? 'user' : 'model';
      
      // Crea un nuovo messaggio o riutilizza l'ultimo se ha lo stesso ruolo
      if (!currentMessage || currentMessage.role !== role) {
        if (currentMessage) {
          vertexMessages.push(currentMessage);
        }
        
        currentMessage = {
          role: role,
          parts: [{
            text: message.content
          }]
        };
      } else {
        // Aggiungi il contenuto al messaggio corrente
        currentMessage.parts.push({
          text: message.content
        });
      }
    }
    
    // Aggiungi l'ultimo messaggio se presente
    if (currentMessage) {
      vertexMessages.push(currentMessage);
    }
    
    return vertexMessages;
  }
} 