/**
 * Provider per Anthropic - Accesso ai modelli Claude tramite API
 * https://docs.anthropic.com/claude/reference/complete_post
 */

import type { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider.js';

interface AnthropicChatRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image';
      text?: string;
      source?: {
        type: 'base64';
        media_type: string;
        data: string;
      };
    }>;
  }>;
  system?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
}

interface AnthropicChatResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamChunk {
  type: string;
  index: number;
  delta?: {
    type: string;
    text: string;
  };
  content_block?: {
    type: string;
    text: string;
  };
  message_stop?: boolean;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider extends BaseLLMProvider {
  name = 'anthropic';
  isLocal = false;
  
  constructor(apiKey?: string, baseUrl: string = 'https://api.anthropic.com/v1') {
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
      throw new Error('AnthropicProvider non configurato correttamente: manca API key');
    }
    
    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per Anthropic
      const formattedData = this.formatMessages(processedMessages);
      
      // Imposta il modello e le opzioni
      formattedData.model = options?.model || 'claude-3-opus-20240229';
      formattedData.temperature = options?.temperature;
      formattedData.max_tokens = options?.max_tokens;
      if (options?.stop) {
        formattedData.stop_sequences = options.stop;
      }
      formattedData.stream = false;
      
      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Anthropic API: ${error}`);
      }
      
      const data = await response.json() as AnthropicChatResponse;
      
      // Estrai il contenuto della risposta
      if (data.content && data.content.length > 0) {
        // Unisci tutti i blocchi di testo
        return data.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('');
      }
      
      return '';
    } catch (error) {
      throw new Error(`Errore nella chiamata ad Anthropic: ${error.message}`);
    }
  }
  
  /**
   * Chiamata in streaming al modello
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('AnthropicProvider non configurato correttamente: manca API key');
    }
    
    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      // Formatta i messaggi per Anthropic
      const formattedData = this.formatMessages(processedMessages);
      
      // Imposta il modello e le opzioni
      formattedData.model = options?.model || 'claude-3-opus-20240229';
      formattedData.temperature = options?.temperature;
      formattedData.max_tokens = options?.max_tokens;
      if (options?.stop) {
        formattedData.stop_sequences = options.stop;
      }
      formattedData.stream = true;
      
      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Anthropic API: ${error}`);
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
          
          // Le risposte Anthropic iniziano con "data: "
          const dataLine = line.startsWith('data: ') ? line.slice(6) : line;
          
          // Alcuni eventi sono ping o messaggi di controllo
          if (dataLine.trim() === '[DONE]' || dataLine.includes('"type":"ping"')) {
            continue;
          }
          
          try {
            const data = JSON.parse(dataLine) as AnthropicStreamChunk;
            
            // Anthropic può inviare il testo in diversi formati
            let textChunk = '';
            if (data.delta && data.delta.text) {
              textChunk = data.delta.text;
            } else if (data.content_block && data.content_block.text) {
              textChunk = data.content_block.text;
            }
            
            if (textChunk) {
              yield textChunk;
            }
          } catch (e) {
            console.warn('Errore nel parsing della risposta Anthropic:', e);
          }
        }
      }
    } catch (error) {
      throw new Error(`Errore nello stream Anthropic: ${error.message}`);
    }
  }
  
  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    // Anthropic non ha un endpoint per elencare i modelli, 
    // quindi restituiamo un elenco hardcoded dei modelli disponibili
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }
  
  /**
   * Formatta i messaggi per l'API Anthropic
   */
  protected formatMessages(messages: LLMMessage[]): AnthropicChatRequest {
    // Estrai il messaggio di sistema se presente
    const systemMessage = messages.find(m => m.role === 'system');
    
    // Converti i messaggi nel formato richiesto da Anthropic
    const anthropicMessages = messages
      .filter(m => m.role !== 'system') // Rimuovi i messaggi di sistema, che verranno trattati separatamente
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content
      }));
    
    // Prepara la richiesta
    const request: AnthropicChatRequest = {
      model: 'claude-3-opus-20240229', // Sarà sovrascritto dalle opzioni
      messages: anthropicMessages,
    };
    
    // Aggiungi il messaggio di sistema se presente
    if (systemMessage) {
      request.system = systemMessage.content;
    }
    
    return request;
  }
} 