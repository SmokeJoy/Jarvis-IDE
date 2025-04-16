/**
 * @file openai-provider.ts
 * @description Provider LLM per OpenAI API
 * @version 1.0.0
 */

import { LLMProviderHandler, LLMRequestOptions, registerProvider } from './provider-registry';
import { createChatMessage as createChatMessage } from "../src/shared/types/chat.types";

/**
 * Configurazione per il provider OpenAI
 */
interface OpenAIConfig {
  /** API key di OpenAI */
  apiKey: string;
  /** URL base API (opzionale) */
  baseUrl?: string;
  /** Timeout in millisecondi */
  timeout?: number;
  /** Modello predefinito */
  defaultModel?: string;
}

/**
 * Implementazione del provider OpenAI
 */
export class OpenAIProvider implements LLMProviderHandler {
  /** Identificatore univoco del provider */
  public readonly name = 'openai';
  /** Descrizione del provider */
  public readonly description = 'Provider per OpenAI API (ChatGPT, GPT-4)';
  /** Flag di disponibilità */
  public isAvailable = false;
  /** Richiede API key */
  public readonly requiresApiKey = true;

  /** Configurazione corrente */
  private config: OpenAIConfig;
  /** Modelli disponibili in cache */
  private availableModelsCache: string[] | null = null;

  /**
   * Costruttore del provider OpenAI
   * @param config Configurazione iniziale
   */
  constructor(config: OpenAIConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      timeout: config.timeout || 30000,
      defaultModel: config.defaultModel || 'gpt-3.5-turbo',
    };

    // Verifica disponibilità iniziale
    this.isAvailable = Boolean(this.config.apiKey);
  }

  /**
   * Aggiorna la configurazione del provider
   * @param config Nuova configurazione
   */
  public updateConfig(config: Partial<OpenAIConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Aggiorna lo stato di disponibilità
    this.isAvailable = Boolean(this.config.apiKey);

    // Resetta la cache dei modelli
    this.availableModelsCache = null;
  }

  /**
   * Effettua una chiamata al servizio OpenAI
   * @param options Opzioni della richiesta
   * @returns Promise con la risposta del modello
   */
  public async call(options: LLMRequestOptions): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Provider OpenAI non disponibile: chiave API mancante');
    }

    if (!this.validateRequest(options)) {
      throw new Error('Parametri richiesta non validi per OpenAI');
    }

    const model = options.model || this.config.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens || 1000;

    try {
      // Prepara il corpo della richiesta per Chat API
      const requestBody = {
        model,
        messages: [
          ...(options.systemMessage ? [createChatMessage({role: 'system', content: options.systemMessage,
              timestamp: Date.now()
        })] : []),
          createChatMessage({role: 'user', content: options.prompt,
              timestamp: Date.now()
        }),
        ],
        temperature,
        max_tokens: maxTokens,
        ...(options.providerParams || {}),
      };

      // Effettua la chiamata API
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API OpenAI (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Estrai il testo dalla risposta
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('Formato risposta OpenAI non valido');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Errore durante la chiamata OpenAI: ${error.message}`);
      }
      throw new Error('Errore sconosciuto durante la chiamata OpenAI');
    }
  }

  /**
   * Recupera i modelli disponibili per OpenAI
   * @returns Promise con la lista dei modelli
   */
  public async getAvailableModels(): Promise<string[]> {
    // Se abbiamo già i modelli in cache, li restituiamo
    if (this.availableModelsCache) {
      return this.availableModelsCache;
    }

    if (!this.isAvailable) {
      return [];
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`Errore recupero modelli OpenAI (${response.status})`);
      }

      const data = await response.json();

      if (Array.isArray(data.data)) {
        // Filtra solo i modelli rilevanti (GPT)
        const models = data.data
          .filter((model: any) => model.id.includes('gpt'))
          .map((model: any) => model.id);

        // Cache dei modelli disponibili
        this.availableModelsCache = models;
        return models;
      }

      return [];
    } catch (error) {
      console.error('Errore durante il recupero dei modelli OpenAI:', error);
      return [];
    }
  }

  /**
   * Valida le opzioni di richiesta per OpenAI
   * @param options Opzioni da validare
   * @returns true se le opzioni sono valide
   */
  public validateRequest(options: LLMRequestOptions): boolean {
    // Verifica presenza del prompt
    if (!options.prompt || typeof options.prompt !== 'string' || options.prompt.trim() === '') {
      return false;
    }

    // Valida temperatura se specificata
    if (options.temperature !== undefined) {
      if (
        typeof options.temperature !== 'number' ||
        options.temperature < 0 ||
        options.temperature > 1
      ) {
        return false;
      }
    }

    // Valida maxTokens se specificato
    if (options.maxTokens !== undefined) {
      if (
        typeof options.maxTokens !== 'number' ||
        options.maxTokens <= 0 ||
        options.maxTokens > 4096
      ) {
        return false;
      }
    }

    // Valida model se specificato
    if (options.model !== undefined && typeof options.model !== 'string') {
      return false;
    }

    return true;
  }
}

/**
 * Crea una nuova istanza del provider OpenAI
 * @param apiKey API key di OpenAI
 * @param config Configurazione aggiuntiva
 * @returns Istanza del provider
 */
export function createOpenAIProvider(
  apiKey: string,
  config?: Partial<Omit<OpenAIConfig, 'apiKey'>>
): OpenAIProvider {
  const provider = new OpenAIProvider({
    apiKey,
    ...config,
  });

  // Registra automaticamente il provider
  registerProvider(provider);

  return provider;
}

// Esporta un'istanza di default (inattiva) che deve essere configurata
export const openaiProvider = new OpenAIProvider({ apiKey: '' });
