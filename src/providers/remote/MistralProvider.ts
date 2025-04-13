/**
 * Provider per Mistral - Accesso ai modelli Mistral AI tramite API
 * https://docs.mistral.ai/api/
 */

import { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider';
import { createSafeMessage } from "../../shared/types/message";

interface MistralChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  safe_prompt?: boolean;
  random_seed?: number;
}

interface MistralChatResponse {
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

interface MistralStreamChunk {
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

interface MistralModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

export class MistralProvider extends BaseLLMProvider {
  name = 'mistral';
  isLocal = false;

  constructor(apiKey?: string, baseUrl: string = 'https://api.mistral.ai/v1') {
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
      throw new Error('MistralProvider non configurato correttamente: manca API key');
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);

    try {
      // Formatta i messaggi per Mistral
      const formattedData = this.formatMessages(processedMessages);

      // Imposta il modello e le opzioni
      formattedData.model = options?.model || 'mistral-large-latest';
      formattedData.temperature = options?.temperature;
      formattedData.max_tokens = options?.max_tokens;
      formattedData.stream = false;

      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Mistral API: ${error}`);
      }

      const data = (await response.json()) as MistralChatResponse;

      // Estrai il contenuto della risposta
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      }

      return '';
    } catch (error) {
      throw new Error(`Errore nella chiamata a Mistral: ${error.message}`);
    }
  }

  /**
   * Chiamata in streaming al modello
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('MistralProvider non configurato correttamente: manca API key');
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);

    try {
      // Formatta i messaggi per Mistral
      const formattedData = this.formatMessages(processedMessages);

      // Imposta il modello e le opzioni
      formattedData.model = options?.model || 'mistral-large-latest';
      formattedData.temperature = options?.temperature;
      formattedData.max_tokens = options?.max_tokens;
      formattedData.stream = true;

      // Effettua la chiamata API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Mistral API: ${error}`);
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

          // Mistral invia linee con prefisso "data: "
          const dataLine = line.startsWith('data: ') ? line.slice(6) : line;

          // L'ultimo messaggio è spesso "data: [DONE]"
          if (dataLine.trim() === '[DONE]') continue;

          try {
            const data = JSON.parse(dataLine) as MistralStreamChunk;
            if (
              data.choices &&
              data.choices.length > 0 &&
              data.choices[0].delta &&
              data.choices[0].delta.content
            ) {
              yield data.choices[0].delta.content;
            }
          } catch (e) {
            console.warn('Errore nel parsing della risposta Mistral:', e);
          }
        }
      }
    } catch (error) {
      throw new Error(`Errore nello stream Mistral: ${error.message}`);
    }
  }

  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('MistralProvider non configurato correttamente: manca API key');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore Mistral API: ${error}`);
      }

      const data = (await response.json()) as MistralModelsResponse;
      return data.data.map((model) => model.id);
    } catch (error) {
      console.error('Errore nel recupero dei modelli Mistral:', error);
      return [
        'mistral-large-latest',
        'mistral-medium-latest',
        'mistral-small-latest',
        'open-mistral-7b',
      ]; // Modelli di default
    }
  }

  /**
   * Formatta i messaggi per l'API Mistral
   */
  protected formatMessages(messages: LLMMessage[]): MistralChatRequest {
    return {
      model: 'mistral-large-latest', // Sarà sovrascritto dalle opzioni
      messages: messages.map((m) => (createSafeMessage({role: m.role, content: m.content}))),
    };
  }
}
