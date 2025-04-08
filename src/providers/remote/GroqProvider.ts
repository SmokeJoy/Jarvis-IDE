/**
 * Provider per Groq - Accesso a modelli LLM con API ad alte prestazioni
 * https://console.groq.com/docs/quickstart
 */

import type { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider.js';

interface GroqChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GroqStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

interface GroqModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

export class GroqProvider extends BaseLLMProvider {
  name = 'groq';
  isLocal = false;
  
  constructor(apiKey?: string, baseUrl: string = 'https://api.groq.com/openai/v1') {
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
      throw new Error('GroqProvider non configurato correttamente: manca API key');
    }
    
    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per Groq
      const formattedData = this.formatMessages(processedMessages);
      
      // Imposta il modello e le opzioni
      formattedData.model = options?.model || 'llama3-70b-8192';
      formattedData.temperature = options?.temperature;
      formattedData.max_tokens = options?.max_tokens;
      formattedData.stop = options?.stop;
      formattedData.stream = false;
      
      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Groq API: ${error}`);
      }
      
      const data = await response.json() as GroqChatResponse;
      
      // Estrai il contenuto della risposta
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      
      return '';
    } catch (error) {
      throw new Error(`Errore nella chiamata a Groq: ${error.message}`);
    }
  }
  
  /**
   * Chiamata in streaming al modello
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('GroqProvider non configurato correttamente: manca API key');
    }
    
    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per Groq
      const formattedData = this.formatMessages(processedMessages);
      
      // Imposta il modello e le opzioni
      formattedData.model = options?.model || 'llama3-70b-8192';
      formattedData.temperature = options?.temperature;
      formattedData.max_tokens = options?.max_tokens;
      formattedData.stop = options?.stop;
      formattedData.stream = true;
      
      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Groq API: ${error}`);
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
          
          // Groq invia linee con prefisso "data: "
          const dataLine = line.startsWith('data: ') ? line.slice(6) : line;
          
          // L'ultimo messaggio è spesso "data: [DONE]"
          if (dataLine.trim() === '[DONE]') continue;
          
          try {
            const data = JSON.parse(dataLine) as GroqStreamChunk;
            if (data.choices && data.choices.length > 0 && data.choices[0].delta && data.choices[0].delta.content) {
              yield data.choices[0].delta.content;
            }
          } catch (e) {
            console.warn('Errore nel parsing della risposta Groq:', e);
          }
        }
      }
    } catch (error) {
      throw new Error(`Errore nello stream Groq: ${error.message}`);
    }
  }
  
  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('GroqProvider non configurato correttamente: manca API key');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Groq API: ${error}`);
      }
      
      const data = await response.json() as GroqModelsResponse;
      return data.data.map(model => model.id);
    } catch (error) {
      console.error('Errore nel recupero dei modelli Groq:', error);
      return [
        'llama3-70b-8192',
        'llama3-8b-8192',
        'mixtral-8x7b-32768',
        'gemma-7b-it'
      ]; // Modelli di default
    }
  }
  
  /**
   * Formatta i messaggi per l'API Groq
   */
  protected formatMessages(messages: LLMMessage[]): GroqChatRequest {
    return {
      model: 'llama3-70b-8192', // Sarà sovrascritto dalle opzioni
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
    };
  }
} 