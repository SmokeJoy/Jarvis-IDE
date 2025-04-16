/**
 * Provider per LMDeploy - Inferenza ottimizzata per modelli LLM
 * https://github.com/InternLM/lmdeploy
 */

import { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider';
import { createChatMessage as createChatMessage } from "../../src/shared/types/chat.types";

interface LMDeployRequest {
  prompt: string;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  n_predict?: number;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface LMDeployChatRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_new_tokens?: number;
  stop?: string[];
  repetition_penalty?: number;
}

interface LMDeployResponse {
  id: string;
  object: string;
  created: number;
  result: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface LMDeployStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  delta: {
    content: string;
  };
}

interface LMDeployModelsResponse {
  models: string[];
}

export class LMDeployProvider extends BaseLLMProvider {
  name = 'lmdeploy';
  isLocal = true;

  constructor(baseUrl: string = 'http://localhost:23333/v1') {
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
      throw new Error('LMDeployProvider non configurato correttamente');
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);

    try {
      // Formatta i messaggi per LMDeploy
      const formattedData = this.formatMessages(processedMessages) as LMDeployChatRequest;

      // Aggiungi le opzioni specifiche
      if (options) {
        formattedData.temperature = options.temperature;
        formattedData.max_new_tokens = options.max_tokens;
        formattedData.stop = options.stop;
        formattedData.stream = false; // Assicurati che non sia in streaming per chiamate sincrone
      }

      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore LMDeploy: ${error}`);
      }

      const data = (await response.json()) as LMDeployResponse;
      return data.result;
    } catch (error) {
      throw new Error(`Errore nella chiamata a LMDeploy: ${error.message}`);
    }
  }

  /**
   * Chiamata in streaming al modello
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('LMDeployProvider non configurato correttamente');
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);

    try {
      // Formatta i messaggi per LMDeploy
      const formattedData = this.formatMessages(processedMessages) as LMDeployChatRequest;

      // Aggiungi le opzioni specifiche
      if (options) {
        formattedData.temperature = options.temperature;
        formattedData.max_new_tokens = options.max_tokens;
        formattedData.stop = options.stop;
        formattedData.stream = true; // Imposta lo streaming
      }

      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore LMDeploy: ${error}`);
      }

      // Gestisci lo stream di risposta
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Impossibile leggere lo stream di risposta');
      }

      const decoder = new TextDecoder();
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

          // LMDeploy invia linee con prefisso "data: "
          const dataLine = line.startsWith('data: ') ? line.slice(6) : line;

          // L'ultimo messaggio è spesso "data: [DONE]"
          if (dataLine.trim() === '[DONE]') continue;

          try {
            const data = JSON.parse(dataLine) as LMDeployStreamResponse;
            if (data.delta && data.delta.content) {
              yield data.delta.content;
            }
          } catch (e) {
            console.warn('Errore nel parsing della risposta LMDeploy:', e);
          }
        }
      }
    } catch (error) {
      throw new Error(`Errore nello stream LMDeploy: ${error.message}`);
    }
  }

  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('LMDeployProvider non configurato correttamente');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore LMDeploy: ${error}`);
      }

      const data = (await response.json()) as LMDeployModelsResponse;
      return data.models;
    } catch (error) {
      console.error('Errore nel recupero dei modelli LMDeploy:', error);
      return ['lmdeploy-model']; // Fallback a un modello generico
    }
  }

  /**
   * Formatta i messaggi per l'API LMDeploy
   */
  protected formatMessages(messages: LLMMessage[]): LMDeployChatRequest {
    return {
      messages: messages.map((m) => (createChatMessage({role: m.role, content: m.content,
          timestamp: Date.now()
    }))),
      stream: false,
    };
  }
}
