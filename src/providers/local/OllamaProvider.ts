/**
 * Provider per Ollama - Modelli locali accessibili tramite API HTTP
 * https://github.com/ollama/ollama
 */

import { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider.js';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  options?: {
    temperature?: number;
    top_k?: number;
    top_p?: number;
    num_predict?: number;
    stop?: string[];
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    tfs_z?: number;
    mirostat?: number;
    mirostat_tau?: number;
    mirostat_eta?: number;
    seed?: number;
    num_ctx?: number;
    num_batch?: number;
    num_gpu?: number;
    num_thread?: number;
  };
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: string;
  keep_alive?: string | number;
  images?: string[];
}

interface OllamaChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
    images?: string[];
  }>;
  options?: {
    temperature?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    stop?: string[];
    seed?: number;
  };
  stream?: boolean;
  format?: string;
  keep_alive?: string | number;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaListModelsResponse {
  models: Array<{
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
      format: string;
      family: string;
      families: string[];
      parameter_size: string;
      quantization_level: string;
    };
  }>;
}

export class OllamaProvider extends BaseLLMProvider {
  name = 'ollama';
  isLocal = true;

  constructor(baseUrl: string = 'http://localhost:11434') {
    super(undefined, baseUrl);
  }

  /**
   * Verifica che il provider sia configurato correttamente
   */
  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  /**
   * Chiamata sincrona al modello
   */
  async call(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OllamaProvider non configurato correttamente');
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per Ollama
      const formattedData = this.formatMessages(processedMessages);
      
      // Aggiungi le opzioni specifiche
      if (options) {
        if (formattedData.options) {
          formattedData.options.temperature = options.temperature;
          formattedData.options.num_predict = options.max_tokens;
          formattedData.options.stop = options.stop;
        }
        
        formattedData.stream = false; // Assicurati che non sia in streaming
      }
      
      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Ollama: ${error}`);
      }
      
      const data = await response.json() as OllamaResponse;
      return data.response;
    } catch (error) {
      throw new Error(`Errore nella chiamata a Ollama: ${error.message}`);
    }
  }

  /**
   * Chiamata in streaming al modello
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('OllamaProvider non configurato correttamente');
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per Ollama
      const formattedData = this.formatMessages(processedMessages);
      
      // Aggiungi le opzioni specifiche
      if (options) {
        if (formattedData.options) {
          formattedData.options.temperature = options.temperature;
          formattedData.options.num_predict = options.max_tokens;
          formattedData.options.stop = options.stop;
        }
        
        formattedData.stream = true; // Imposta lo streaming
      }
      
      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Ollama: ${error}`);
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
            const data = JSON.parse(line) as OllamaResponse;
            yield data.response;
          } catch (e) {
            console.warn('Errore nel parsing della risposta Ollama:', e);
          }
        }
      }
      
      // Gestisci eventuali dati residui nel buffer
      if (buffer.trim() !== '') {
        try {
          const data = JSON.parse(buffer) as OllamaResponse;
          yield data.response;
        } catch (e) {
          console.warn('Errore nel parsing della risposta Ollama finale:', e);
        }
      }
      
    } catch (error) {
      throw new Error(`Errore nello stream Ollama: ${error.message}`);
    }
  }

  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('OllamaProvider non configurato correttamente');
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Ollama: ${error}`);
      }
      
      const data = await response.json() as OllamaListModelsResponse;
      return data.models.map(model => model.name);
    } catch (error) {
      console.error('Errore nel recupero dei modelli Ollama:', error);
      return [];
    }
  }

  /**
   * Formatta i messaggi per l'API Ollama
   */
  protected formatMessages(messages: LLMMessage[]): OllamaChatRequest {
    // Estrai il messaggio di sistema se presente
    const systemMessage = messages.find(m => m.role === 'system');
    
    // Prepara la richiesta standard di chat
    const request: OllamaChatRequest = {
      model: 'llama2', // Valore di default, sarà sovrascritto dalle opzioni
      messages: messages
        .filter(m => m.role !== 'system') // Rimuovi i messaggi di sistema qui
        .map(m => ({
          role: m.role,
          content: m.content
        })),
      stream: false,
    };
    
    // Se c'è un messaggio di sistema, aggiungilo nel formato appropriato
    // per Ollama, che gestisce il messaggio di sistema separatamente
    if (systemMessage) {
      request.messages.unshift({
        role: 'system',
        content: systemMessage.content
      });
    }
    
    return request;
  }
} 