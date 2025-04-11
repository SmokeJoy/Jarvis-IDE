import type { ApiProvider, StreamHandler } from '../ApiProvider.js';
import type { ChatMessage } from '../../../types/ChatMessage.js';
import { OllamaTransformer } from '../../../api/transform/ollama-format.js';
import { logger } from '../../../utils/logger.js';

type OllamaModel = {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
};

/**
 * Provider per Ollama (modelli LLM locali)
 */
export class OllamaProvider implements ApiProvider {
  readonly id = 'ollama';
  readonly label = 'Ollama';
  
  /**
   * Verifica se il provider supporta lo streaming
   */
  isStreamable(): boolean {
    return true; // Ollama supporta nativamente lo streaming
  }

  /**
   * Rileva i modelli disponibili in Ollama
   * @param baseUrl URL base di Ollama
   * @returns Array di modelli disponibili
   */
  async detectAvailableModels(baseUrl: string = 'http://localhost:11434'): Promise<string[]> {
    try {
      const url = `${baseUrl}/api/tags`;
      logger.debug('[OllamaProvider] Rilevamento modelli disponibili', { url });

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        logger.warn('[OllamaProvider] Impossibile rilevare i modelli disponibili', { 
          status: res.status,
          statusText: res.statusText
        });
        return [];
      }

      const data = await res.json();
      // Estrai i nomi dei modelli dall'oggetto risposta
      const modelIds = data.models?.map((model: OllamaModel) => model.name) || [];
      
      logger.debug('[OllamaProvider] Modelli disponibili rilevati', { modelIds });
      return modelIds;
    } catch (err) {
      logger.warn('[OllamaProvider] Errore nel rilevamento dei modelli', { err });
      return [];
    }
  }

  /**
   * Ottiene un modello appropriato basato sui modelli disponibili o un fallback
   * @param availableModels Modelli disponibili
   * @param isFunctionCall Se true, preferisce modelli adatti a function calling
   * @param isVision Se true, preferisce modelli con supporto vision
   * @returns ID del modello da utilizzare
   */
  getAppropriateModel(
    availableModels: string[] = [], 
    isFunctionCall: boolean = false,
    isVision: boolean = false
  ): string {
    // Se è richiesto Vision (supporto immagini)
    if (isVision) {
      const visionModels = [
        'llava',
        'llava-13b',
        'llava-7b',
        'bakllava',
        'moondream'
      ];
      
      for (const visionModel of visionModels) {
        if (availableModels.some(m => m.includes(visionModel))) {
          const match = availableModels.find(m => m.includes(visionModel));
          if (match) return match;
        }
      }
    }
    
    // Priorità per function calling
    if (isFunctionCall) {
      const functionCallingPreference = [
        'codellama',
        'codellama-7b',
        'codellama-13b',
        'codellama-34b',
        'deepseek-coder',
        'deepseek-coder-6.7b',
        'deepseek-coder-33b',
        'wizardlm',
        'wizard-coder',
        'starcoder',
        'starcoder-16b'
      ];
      
      for (const modelId of functionCallingPreference) {
        if (availableModels.some(m => m.includes(modelId))) {
          const match = availableModels.find(m => m.includes(modelId));
          if (match) return match;
        }
      }
    }
    
    // Priorità generale per conversazione
    const generalPreference = [
      'llama3',
      'llama-3',
      'mistral', 
      'mixtral',
      'mistral-7b',
      'mistral-small',
      'phi3',
      'phi-3',
      'gemma',
      'gemma-7b',
      'vicuna',
      'llama2',
      'llama-2'
    ];
    
    for (const modelId of generalPreference) {
      if (availableModels.some(m => m.includes(modelId))) {
        const match = availableModels.find(m => m.includes(modelId));
        if (match) return match;
      }
    }
    
    // Se c'è almeno un modello disponibile, usa il primo
    if (availableModels.length > 0) {
      return availableModels[0];
    }
    
    // Fallback se non ci sono modelli disponibili
    return isFunctionCall ? 'codellama:7b' : 'mistral';
  }

  /**
   * Chat standard (non streaming)
   */
  async chat(
    messages: ChatMessage[],
    apiKey: string, // non usato per Ollama
    baseUrl?: string,
    systemPrompt?: string,
    options?: {
      functions?: Array<{
        name: string;
        description?: string;
        parameters: Record<string, any>;
      }>;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ChatMessage> {
    const ollamaBaseUrl = baseUrl || 'http://localhost:11434';
    const url = `${ollamaBaseUrl}/api/chat`;
    const ollamaMessages = OllamaTransformer.toLLMMessages(messages, systemPrompt);
    
    // Rileva immagini nei messaggi
    const hasImages = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(part => part.type === 'image')
    );
    
    // Rileva i modelli disponibili
    const availableModels = await this.detectAvailableModels(ollamaBaseUrl);
    const hasFunctions = options?.functions && options.functions.length > 0;
    const modelToUse = this.getAppropriateModel(availableModels, hasFunctions, hasImages);

    const requestBody: any = {
      model: modelToUse,
      messages: ollamaMessages,
      options: {
        temperature: options?.temperature || 0.7,
        num_predict: options?.maxTokens || 2048
      },
      stream: false
    };

    // Aggiungi system prompt se disponibile
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    // Aggiungi function calling se disponibile
    // Nota: Ollama non supporta nativamente function calling, ma possiamo
    // aggiungere le funzioni come parte del system prompt per i modelli che lo supportano
    if (hasFunctions) {
      // Descrivi le funzioni disponibili in un formato che il modello possa capire
      const functionsDescription = options.functions
        .map(func => {
          return `Funzione: ${func.name}
Descrizione: ${func.description || ''}
Parametri: ${JSON.stringify(func.parameters, null, 2)}`;
        })
        .join('\n\n');

      const functionInstructions = `Puoi chiamare le seguenti funzioni quando appropriato:
${functionsDescription}

Per chiamare una funzione, rispondi esattamente con questo formato:
[FUNCTION_CALL: nome_funzione({...args JSON...})]
`;

      // Aggiungi le istruzioni per function call al system prompt
      if (requestBody.system) {
        requestBody.system += '\n\n' + functionInstructions;
      } else {
        requestBody.system = functionInstructions;
      }
    }

    logger.debug('[OllamaProvider] Invio richiesta chat', { url, modelToUse, requestBody });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Errore Ollama: ${res.status} - ${error}`);
      }

      const data = await res.json();
      logger.debug('[OllamaProvider] Risposta ricevuta', { data });

      return OllamaTransformer.fromLLMResponse(data, modelToUse);
    } catch (err) {
      logger.error('[OllamaProvider] Errore durante la chat', { err });
      throw err;
    }
  }

  /**
   * Chat in streaming
   */
  async streamChat(
    messages: ChatMessage[],
    apiKey: string, // non usato per Ollama
    baseUrl?: string,
    handler?: StreamHandler,
    systemPrompt?: string,
    options?: {
      functions?: Array<{
        name: string;
        description?: string;
        parameters: Record<string, any>;
      }>;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const ollamaBaseUrl = baseUrl || 'http://localhost:11434';
    const url = `${ollamaBaseUrl}/api/chat`;
    const ollamaMessages = OllamaTransformer.toLLMMessages(messages, systemPrompt);
    
    // Rileva immagini nei messaggi
    const hasImages = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(part => part.type === 'image')
    );
    
    // Rileva i modelli disponibili
    const availableModels = await this.detectAvailableModels(ollamaBaseUrl);
    const hasFunctions = options?.functions && options.functions.length > 0;
    const modelToUse = this.getAppropriateModel(availableModels, hasFunctions, hasImages);

    const requestBody: any = {
      model: modelToUse,
      messages: ollamaMessages,
      options: {
        temperature: options?.temperature || 0.7,
        num_predict: options?.maxTokens || 2048
      },
      stream: true
    };

    // Aggiungi system prompt se disponibile
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    // Aggiungi function calling se disponibile
    if (hasFunctions) {
      // Descrivi le funzioni disponibili in un formato che il modello possa capire
      const functionsDescription = options.functions
        .map(func => {
          return `Funzione: ${func.name}
Descrizione: ${func.description || ''}
Parametri: ${JSON.stringify(func.parameters, null, 2)}`;
        })
        .join('\n\n');

      const functionInstructions = `Puoi chiamare le seguenti funzioni quando appropriato:
${functionsDescription}

Per chiamare una funzione, rispondi esattamente con questo formato:
[FUNCTION_CALL: nome_funzione({...args JSON...})]
`;

      // Aggiungi le istruzioni per function call al system prompt
      if (requestBody.system) {
        requestBody.system += '\n\n' + functionInstructions;
      } else {
        requestBody.system = functionInstructions;
      }
    }

    logger.debug('[OllamaProvider] Invio richiesta streaming', { url, modelToUse, requestBody });
    let fullResponse = '';
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const error = await res.text();
        const errorMessage = `Errore Ollama: ${res.status} - ${error}`;
        handler?.onError?.(new Error(errorMessage));
        throw new Error(errorMessage);
      }

      if (!res.body) {
        throw new Error('Stream non supportato dal browser');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
          // Ollama invia ogni chunk come un oggetto JSON
          const data = JSON.parse(chunk);
          
          // Se c'è contenuto, aggiungi al risultato
          if (data.message?.content) {
            const content = data.message.content;
            fullResponse += content;
            handler?.onToken?.(content);
          }
          
          // Se done è true, abbiamo finito
          if (data.done) {
            break;
          }
        } catch (e) {
          logger.error('[OllamaProvider] Errore parsing chunk', { chunk, error: e });
          continue;
        }
      }

      // Controlla se c'è una function call nella risposta completa
      if (hasFunctions && fullResponse.includes('[FUNCTION_CALL:')) {
        const functionCallMatch = fullResponse.match(/\[FUNCTION_CALL:\s*([^\]]+)\]/);
        if (functionCallMatch && functionCallMatch[1]) {
          logger.debug('[OllamaProvider] Function call rilevata', { functionCall: functionCallMatch[1] });
        }
      }

      handler?.onComplete?.(fullResponse);
      return fullResponse;
    } catch (err) {
      logger.error('[OllamaProvider] Errore durante lo streaming', { err });
      handler?.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }
} 