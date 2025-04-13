/**
 * Provider per LM Studio - Modelli locali accessibili tramite API HTTP
 * https://lmstudio.ai/
 */

import { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider';
import { createSafeMessage } from "../../shared/types/message";

interface LMStudioChatRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  stop?: string[];
  repeat_penalty?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stream?: boolean;
  model?: string;
}

interface LMStudioChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string | null;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface LMStudioModelsResponse {
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
  object: string;
}

export class LMStudioProvider extends BaseLLMProvider {
  name = 'lmstudio';
  isLocal = true;

  constructor(baseUrl: string = 'http://localhost:1234/v1') {
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
      throw new Error('LMStudioProvider non configurato correttamente');
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);

    try {
      // Formatta i messaggi per LM Studio
      const formattedData = this.formatMessages(processedMessages);

      // Aggiungi le opzioni specifiche
      if (options) {
        formattedData.temperature = options.temperature;
        formattedData.max_tokens = options.max_tokens;
        formattedData.stop = options.stop;
        formattedData.stream = false; // Assicurati che non sia in streaming per chiamate sincrone
        if (options.model) {
          formattedData.model = options.model;
        }
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
        throw new Error(`Errore LM Studio: ${error}`);
      }

      const data = (await response.json()) as LMStudioChatResponse;

      // Estrai il contenuto della risposta
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      }

      return '';
    } catch (error) {
      throw new Error(`Errore nella chiamata a LM Studio: ${error.message}`);
    }
  }

  /**
   * Chiamata in streaming al modello
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      throw new Error('LMStudioProvider non configurato correttamente');
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);

    try {
      // Formatta i messaggi per LM Studio
      const formattedData = this.formatMessages(processedMessages);

      // Aggiungi le opzioni specifiche
      if (options) {
        formattedData.temperature = options.temperature;
        formattedData.max_tokens = options.max_tokens;
        formattedData.stop = options.stop;
        formattedData.stream = true; // Imposta lo streaming
        if (options.model) {
          formattedData.model = options.model;
        }
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
        throw new Error(`Errore LM Studio: ${error}`);
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

          // LM Studio invia linee con prefisso "data: "
          const dataLine = line.startsWith('data: ') ? line.slice(6) : line;

          // L'ultimo messaggio è spesso "data: [DONE]"
          if (dataLine.trim() === '[DONE]') continue;

          try {
            const data = JSON.parse(dataLine) as LMStudioChatResponse;
            if (
              data.choices &&
              data.choices.length > 0 &&
              data.choices[0].delta &&
              data.choices[0].delta.content
            ) {
              yield data.choices[0].delta.content;
            }
          } catch (e) {
            console.warn('Errore nel parsing della risposta LM Studio:', e);
          }
        }
      }
    } catch (error) {
      throw new Error(`Errore nello stream LM Studio: ${error.message}`);
    }
  }

  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('LMStudioProvider non configurato correttamente');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Errore LM Studio: ${error}`);
      }

      const data = (await response.json()) as LMStudioModelsResponse;
      return data.data.map((model) => model.id);
    } catch (error) {
      console.error('Errore nel recupero dei modelli LM Studio:', error);
      return []; // Ritorna una lista vuota in caso di errore
    }
  }

  /**
   * Formatta i messaggi per l'API LM Studio (compatibile con OpenAI)
   */
  protected formatMessages(messages: LLMMessage[]): LMStudioChatRequest {
    // LM Studio utilizza lo stesso formato di OpenAI
    return {
      messages: messages.map((m) => (createSafeMessage({role: m.role, content: m.content}))),
      stream: false,
    };
  }
}
