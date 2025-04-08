import type { ApiProvider, ProviderOptions } from './base.js';
import type { ChatCompletionOptions, ChatCompletion, LLMProviderId, StreamChunk } from '../../types/global.js';
import { ModelInfo } from '../../shared/types/api.types.js';
import { Logger } from '../../utils/logger.js';
import * as http from 'http';

/**
 * Provider per LM Studio (API locale)
 */
export class LMStudioProvider implements ApiProvider {
  // Identificatore del provider
  readonly id: LLMProviderId = 'lmstudio';
  
  // Supporta lo streaming
  readonly supportsStream: boolean = true;
  
  // Opzioni di configurazione
  private options: ProviderOptions;
  
  constructor(options: ProviderOptions) {
    this.options = options;
    
    // Imposta valori predefiniti
    if (!this.options.baseUrl) {
      this.options.baseUrl = 'http://localhost:1234';
    }
    
    Logger.info(`Inizializzato provider LM Studio: ${this.options.baseUrl}`);
  }
  
  /**
   * Genera una risposta in streaming usando l'API di LM Studio
   */
  async *streamChat(options: ChatCompletionOptions): AsyncGenerator<StreamChunk> {
    // Prepara la richiesta
    const requestData = JSON.stringify({
      model: options.model || this.options.modelId || 'deepseek-coder',
      prompt: this.formatMessages(options),
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 4096,
      stream: true,
      stop: ['```', '---']
    });
    
    // Timeout predefinito per la connessione
    const timeout = 60000;
    
    try {
      // Crea generatore di stream
      for await (const chunk of this.createStreamRequest(requestData, timeout)) {
        // Invia il chunk
        yield {
          type: 'text',
          text: chunk
        };
      }
    } catch (error) {
      Logger.error(`Errore nello streaming LM Studio: ${error}`);
      yield {
        type: 'error',
        text: `Errore: ${error}`
      };
    }
  }
  
  /**
   * Genera una risposta completa (non in streaming)
   */
  async chat(options: ChatCompletionOptions): Promise<ChatCompletion> {
    try {
      // Prepara la richiesta
      const requestData = JSON.stringify({
        model: options.model || this.options.modelId || 'deepseek-coder',
        prompt: this.formatMessages(options),
        temperature: options.temperature || 0.2,
        max_tokens: options.maxTokens || 4096,
        stream: false,
        stop: ['```', '---']
      });
      
      // Effettua la richiesta HTTP
      return new Promise((resolve, reject) => {
        const url = new URL('/v1/completions', this.options.baseUrl);
        
        const req = http.request({
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
          }
        }, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              if (res.statusCode !== 200) {
                return reject(new Error(`Errore HTTP: ${res.statusCode} ${res.statusMessage}`));
              }
              
              const json = JSON.parse(data);
              resolve({
                text: json.choices?.[0]?.text || '',
                usage: {
                  inputTokens: json.usage?.prompt_tokens || 0,
                  outputTokens: json.usage?.completion_tokens || 0
                }
              });
            } catch (error) {
              reject(error);
            }
          });
        });
        
        req.on('error', reject);
        req.write(requestData);
        req.end();
      });
    } catch (error) {
      Logger.error(`Errore nella chiamata LM Studio: ${error}`);
      throw error;
    }
  }
  
  /**
   * Formatta i messaggi per l'API di LM Studio
   */
  private formatMessages(options: ChatCompletionOptions): string {
    // LM Studio accetta un singolo prompt come stringa
    let finalPrompt = '';
    
    // Aggiungi il prompt di sistema se presente
    if (options.systemPrompt) {
      finalPrompt += `# Istruzioni di sistema\n${options.systemPrompt}\n\n`;
    }
    
    // Aggiungi i messaggi
    for (const msg of options.messages) {
      if (msg.role === 'user') {
        finalPrompt += `# Utente\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        finalPrompt += `# Assistente\n${msg.content}\n\n`;
      } else if (msg.role === 'system') {
        // Aggiungi prompt di sistema solo se non è già stato aggiunto
        if (!options.systemPrompt) {
          finalPrompt += `# Istruzioni di sistema\n${msg.content}\n\n`;
        }
      }
    }
    
    // Aggiungi indicazione per la risposta dell'assistente
    finalPrompt += '# Assistente\n';
    
    return finalPrompt;
  }
  
  /**
   * Crea una richiesta HTTP con stream e restituisce un generatore asincrono
   */
  private async *createStreamRequest(requestData: string, timeout: number): AsyncGenerator<string> {
    return new Promise((resolve, reject) => {
      const url = new URL('/v1/completions', this.options.baseUrl);
      
      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData)
        },
        timeout
      });
      
      let buffer = '';
      let resolver: (value: AsyncGenerator<string>) => void;
      
      const generator = (async function* () {
        try {
          while (true) {
            if (buffer.length > 0) {
              const data = buffer;
              buffer = '';
              
              try {
                const lines = data.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const content = line.slice(6);
                    
                    if (content === '[DONE]') {
                      return;
                    }
                    
                    try {
                      const json = JSON.parse(content);
                      const text = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text || '';
                      
                      if (text) {
                        yield text;
                      }
                    } catch (e) {
                      // Ignora linee non JSON
                      Logger.debug(`Errore nel parsing JSON: ${e}`);
                    }
                  }
                }
              } catch (e) {
                Logger.error(`Errore nell'elaborazione dello stream: ${e}`);
              }
            }
            
            // Attendi il prossimo chunk
            yield* await new Promise<string[]>(resolve => {
              req.once('data', chunk => {
                resolve([chunk.toString()]);
              });
            });
          }
        } catch (e) {
          Logger.error(`Errore nel generatore di stream: ${e}`);
          throw e;
        }
      })();
      
      resolver = resolve;
      
      req.on('response', (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Errore HTTP: ${res.statusCode} ${res.statusMessage}`));
          return;
        }
        
        res.on('data', (chunk) => {
          buffer += chunk.toString();
        });
        
        res.on('end', () => {
          buffer += '[DONE]';
        });
        
        resolver(generator);
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout della richiesta'));
      });
      
      req.write(requestData);
      req.end();
    });
  }
  
  /**
   * Restituisce informazioni sul modello
   */
  getModel(): { id: string; info: ModelInfo } {
    return {
      id: this.options.modelId || 'deepseek-coder',
      info: {
        supportsPromptCache: false,
        name: this.options.modelId || 'deepseek-coder',
        context_length: 8192,
        maxTokens: 4096,
        description: 'Modello locale via LM Studio'
      }
    };
  }
} 