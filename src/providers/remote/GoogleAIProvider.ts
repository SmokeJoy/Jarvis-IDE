/**
 * Provider per Google AI - Accesso ai modelli Gemini tramite API
 * https://ai.google.dev/api/rest
 */

import type { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider.js.js';

interface GoogleAIChatRequest {
  contents: Array<{
    role: string;
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  systemInstruction?: {
    parts: Array<{
      text: string;
    }>;
  };
}

interface GoogleAIChatResponse {
  candidates: Array<{
    content: {
      role: string;
      parts: Array<{
        text?: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GoogleAIStreamChunk {
  candidates: Array<{
    content: {
      role: string;
      parts: Array<{
        text?: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GoogleAIProvider extends BaseLLMProvider {
  name = 'googleai';
  isLocal = false;
  
  constructor(apiKey?: string, baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta') {
    super(apiKey, baseUrl);
  }
  
  /**
   * Verifica che il provider sia configurato correttamente
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  /**
   * Chiamata sincrona al modello
   */
  async call(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('GoogleAIProvider non configurato correttamente: manca API key');
    }
    
    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per Google AI
      const formattedData = this.formatMessages(processedMessages);
      
      // Imposta le opzioni di generazione
      if (options) {
        formattedData.generationConfig = {
          temperature: options.temperature,
          maxOutputTokens: options.max_tokens,
          stopSequences: options.stop
        };
      }
      
      // Determina il modello da utilizzare
      const modelId = options?.model || 'gemini-1.5-pro';
      
      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/models/${modelId}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Google AI API: ${error}`);
      }
      
      const data = await response.json() as GoogleAIChatResponse;
      
      // Estrai il contenuto della risposta
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && data.candidates[0].content.parts) {
        // Unisci tutte le parti di testo
        return data.candidates[0].content.parts
          .map(part => part.text || '')
          .join('');
      }
      
      return '';
    } catch (error) {
      throw new Error(`Errore nella chiamata a Google AI: ${error.message}`);
    }
  }
  
  /**
   * Chiamata in streaming al modello
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('GoogleAIProvider non configurato correttamente: manca API key');
    }
    
    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per Google AI
      const formattedData = this.formatMessages(processedMessages);
      
      // Imposta le opzioni di generazione
      if (options) {
        formattedData.generationConfig = {
          temperature: options.temperature,
          maxOutputTokens: options.max_tokens,
          stopSequences: options.stop
        };
      }
      
      // Determina il modello da utilizzare
      const modelId = options?.model || 'gemini-1.5-pro';
      
      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/models/${modelId}:streamGenerateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Google AI API: ${error}`);
      }
      
      // Gestisci lo stream di risposta
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Impossibile leggere lo stream di risposta');
      }
      
      let decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Aggiungi i nuovi dati al buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Dividi il buffer in linee
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // L'ultima linea potrebbe essere incompleta
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const data = JSON.parse(line) as GoogleAIStreamChunk;
            
            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && data.candidates[0].content.parts) {
              // Estrai il testo da questa parte della risposta
              const textChunk = data.candidates[0].content.parts
                .map(part => part.text || '')
                .join('');
              
              if (textChunk) {
                yield textChunk;
              }
            }
          } catch (e) {
            console.warn('Errore nel parsing della risposta Google AI:', e);
          }
        }
      }
    } catch (error) {
      throw new Error(`Errore nello stream Google AI: ${error.message}`);
    }
  }
  
  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('GoogleAIProvider non configurato correttamente: manca API key');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Google AI API: ${error}`);
      }
      
      const data = await response.json();
      
      if (data.models && Array.isArray(data.models)) {
        return data.models
          .filter((model: any) => model.name && model.name.includes('gemini'))
          .map((model: any) => model.name.split('/').pop());
      }
      
      return [];
    } catch (error) {
      console.error('Errore nel recupero dei modelli Google AI:', error);
      // Fallback ai modelli noti
      return [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-1.0-pro-vision'
      ];
    }
  }
  
  /**
   * Formatta i messaggi per l'API Google AI
   */
  protected formatMessages(messages: LLMMessage[]): GoogleAIChatRequest {
    // Estrai il messaggio di sistema se presente
    const systemMessage = messages.find(m => m.role === 'system');
    
    // Prepara i contenuti
    const contents = messages
      .filter(m => m.role !== 'system') // Rimuovi i messaggi di sistema, che verranno trattati separatamente
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
    
    // Prepara la richiesta
    const request: GoogleAIChatRequest = {
      contents,
    };
    
    // Aggiungi il messaggio di sistema se presente
    if (systemMessage) {
      request.systemInstruction = {
        parts: [{ text: systemMessage.content }]
      };
    }
    
    return request;
  }
} 