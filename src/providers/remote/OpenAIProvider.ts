/**
 * Provider per OpenAI - Accesso ai modelli GPT tramite API
 * https://platform.openai.com/docs/api-reference
 */

import type { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider.js';

interface OpenAIChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string | Array<{
      type: string;
      text?: string;
      image_url?: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
      };
    }>;
  }>;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}

interface OpenAIChatCompletionResponse {
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

interface OpenAIStreamChunk {
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

interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
  object: string;
}

export class OpenAIProvider extends BaseLLMProvider {
  name = 'openai';
  isLocal = false;
  
  constructor(apiKey?: string, baseUrl: string = 'https://api.openai.com/v1') {
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
      throw new Error('OpenAIProvider non configurato correttamente: manca API key');
    }
    
    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per OpenAI
      const formattedData = this.formatMessages(processedMessages);
      
      // Aggiungi le opzioni specifiche
      formattedData.model = options?.model || 'gpt-4';
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
        throw new Error(`Errore OpenAI API: ${error}`);
      }
      
      const data = await response.json() as OpenAIChatCompletionResponse;
      
      // Estrai il contenuto della risposta
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      
      return '';
    } catch (error) {
      throw new Error(`Errore nella chiamata a OpenAI: ${error.message}`);
    }
  }
  
  /**
   * Chiamata in streaming al modello
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenAIProvider non configurato correttamente: manca API key');
    }
    
    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per OpenAI
      const formattedData = this.formatMessages(processedMessages);
      
      // Aggiungi le opzioni specifiche
      formattedData.model = options?.model || 'gpt-4';
      formattedData.temperature = options?.temperature;
      formattedData.max_tokens = options?.max_tokens;
      formattedData.stop = options?.stop;
      formattedData.stream = true; // Imposta lo streaming
      
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
        throw new Error(`Errore OpenAI API: ${error}`);
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
          
          // OpenAI invia linee con prefisso "data: "
          const dataLine = line.startsWith('data: ') ? line.slice(6) : line;
          
          // L'ultimo messaggio è spesso "data: [DONE]"
          if (dataLine.trim() === '[DONE]') continue;
          
          try {
            const data = JSON.parse(dataLine) as OpenAIStreamChunk;
            if (data.choices && data.choices.length > 0 && data.choices[0].delta && data.choices[0].delta.content) {
              yield data.choices[0].delta.content;
            }
          } catch (e) {
            console.warn('Errore nel parsing della risposta OpenAI:', e);
          }
        }
      }
    } catch (error) {
      throw new Error(`Errore nello stream OpenAI: ${error.message}`);
    }
  }
  
  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenAIProvider non configurato correttamente: manca API key');
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
        throw new Error(`Errore OpenAI API: ${error}`);
      }
      
      const data = await response.json() as OpenAIModelsResponse;
      
      // Filtra solo i modelli GPT
      return data.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id);
    } catch (error) {
      console.error('Errore nel recupero dei modelli OpenAI:', error);
      return [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gpt-3.5-turbo'
      ]; // Modelli di default
    }
  }
  
  /**
   * Formatta i messaggi per l'API OpenAI
   */
  protected formatMessages(messages: LLMMessage[]): OpenAIChatCompletionRequest {
    return {
      model: 'gpt-4', // Sarà sovrascritto dalle opzioni
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
    };
  }
} 