/**
 * Base per tutti i provider LLM, definisce l'interfaccia comune
 * che ogni provider deve implementare.
 */

import { LLMProvider } from "../shared/types/api.types.js";

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  model: string;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
  stream?: boolean;
  contextPrompt?: string;
  use_docs?: boolean;
  coder_mode?: boolean;
  multi_agent?: boolean;
  [key: string]: any;
}

/**
 * Classe base astratta che definisce un provider LLM
 * Implementa l'interfaccia LLMProvider
 */
export abstract class BaseLLMProvider implements LLMProvider {
  /** Nome univoco del provider */
  abstract name: string;
  
  /** Indica se il provider è locale o remoto */
  abstract isLocal: boolean;
  
  /** API Key o token di autenticazione, se necessario */
  protected apiKey?: string;
  
  /** Endpoint base API, se applicabile */
  protected baseUrl?: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Chiamata sincrona al modello LLM
   * @param messages Lista di messaggi da inviare al modello
   * @param options Opzioni per la chiamata
   * @returns Risposta del modello
   */
  abstract call(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
  
  /**
   * Chiamata in streaming al modello LLM
   * @param messages Lista di messaggi da inviare al modello
   * @param options Opzioni per la chiamata
   * @returns Generator che produce la risposta del modello in streaming
   */
  abstract stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string>;
  
  /**
   * Ottiene la lista dei modelli disponibili per questo provider
   * @returns Lista dei nomi dei modelli
   */
  abstract listModels(): Promise<string[]>;
  
  /**
   * Verifica se il provider è configurato correttamente
   * @returns True se configurato correttamente, altrimenti false
   */
  abstract isConfigured(): boolean;
  
  /**
   * Formatta i messaggi nel formato richiesto dal provider specifico
   * @param messages Lista di messaggi in formato LLMMessage
   * @returns Messaggi formattati secondo le specifiche del provider
   */
  protected abstract formatMessages(messages: LLMMessage[]): any;
  
  /**
   * Applica le opzioni MCP specifiche del Jarvis IDE
   * @param messages Lista di messaggi originali
   * @param options Opzioni fornite
   * @returns Messaggi modificati secondo il protocollo MCP
   */
  protected applyMCPOptions(messages: LLMMessage[], options?: LLMOptions): LLMMessage[] {
    if (!options) return messages;
    
    // Copia i messaggi per non modificare l'originale
    const processedMessages = [...messages];
    
    // Aggiungi il contextPrompt se presente
    if (options.contextPrompt) {
      // Cerca il primo messaggio di sistema o aggiungine uno nuovo
      const systemIndex = processedMessages.findIndex(m => m.role === 'system');
      
      if (systemIndex >= 0) {
        // Modifica il messaggio di sistema esistente
        processedMessages[systemIndex] = {
          ...processedMessages[systemIndex],
          content: `${processedMessages[systemIndex].content}\n\n${options.contextPrompt}`
        };
      } else {
        // Aggiungi un nuovo messaggio di sistema all'inizio
        processedMessages.unshift({
          role: 'system',
          content: options.contextPrompt
        });
      }
    }
    
    // Aggiungi istruzioni per use_docs se abilitato
    if (options.use_docs === true) {
      // Cerca il primo messaggio di sistema o aggiungine uno nuovo
      const systemIndex = processedMessages.findIndex(m => m.role === 'system');
      
      if (systemIndex >= 0) {
        // Modifica il messaggio di sistema esistente
        processedMessages[systemIndex] = {
          ...processedMessages[systemIndex],
          content: `${processedMessages[systemIndex].content}\n\nFai riferimento alla documentazione allegata quando disponibile.`
        };
      }
    }
    
    // Aggiungi istruzioni per coder_mode se abilitato
    if (options.coder_mode === true) {
      // Cerca il primo messaggio di sistema o aggiungine uno nuovo
      const systemIndex = processedMessages.findIndex(m => m.role === 'system');
      
      if (systemIndex >= 0) {
        // Modifica il messaggio di sistema esistente
        processedMessages[systemIndex] = {
          ...processedMessages[systemIndex],
          content: `${processedMessages[systemIndex].content}\n\nRispondi con focus sulla programmazione e sul codice. Fornisci risposte concise e tecniche.`
        };
      }
    }
    
    // Aggiungi istruzioni per multi_agent se abilitato
    if (options.multi_agent === true) {
      // Cerca il primo messaggio di sistema o aggiungine uno nuovo
      const systemIndex = processedMessages.findIndex(m => m.role === 'system');
      
      if (systemIndex >= 0) {
        // Modifica il messaggio di sistema esistente
        processedMessages[systemIndex] = {
          ...processedMessages[systemIndex],
          content: `${processedMessages[systemIndex].content}\n\nPuoi assumere diversi ruoli o collaborare con altri esperti virtuali per risolvere problemi complessi.`
        };
      }
    }
    
    return processedMessages;
  }
} 