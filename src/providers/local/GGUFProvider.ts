/**
 * Provider per modelli GGUF - formati unificati per modelli GGML
 * Richiede una configurazione specifica e dipende da un'implementazione locale.
 */

import { BaseLLMProvider, LLMMessage, LLMOptions } from '../BaseLLMProvider.js';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

export interface GGUFConfig {
  /** Percorso completo al binario llama.cpp o altro binario compatibile */
  binaryPath: string;
  /** Directory dove sono archiviati i modelli GGUF */
  modelsPath: string;
  /** Controlli disponibili sui thread CPU */
  threads?: number;
  /** Dimensione del contesto supportata */
  contextSize?: number;
}

export class GGUFProvider extends BaseLLMProvider {
  name = 'gguf';
  isLocal = true;
  private config: GGUFConfig;
  private availableModels: string[] = [];
  private isInitialized: boolean = false;

  constructor(config: GGUFConfig) {
    super();
    this.config = config;
  }

  /**
   * Inizializza il provider scansionando la cartella dei modelli
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Verifica che il binario esista
      if (!fs.existsSync(this.config.binaryPath)) {
        throw new Error(`Binario non trovato: ${this.config.binaryPath}`);
      }
      
      // Verifica che la cartella dei modelli esista
      if (!fs.existsSync(this.config.modelsPath)) {
        throw new Error(`Cartella modelli non trovata: ${this.config.modelsPath}`);
      }
      
      // Scansiona la cartella per i modelli GGUF
      const files = fs.readdirSync(this.config.modelsPath);
      this.availableModels = files
        .filter(file => file.endsWith('.gguf') || file.endsWith('.bin'))
        .map(file => path.basename(file, path.extname(file)));
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Errore nell\'inizializzazione del provider GGUF:', error);
      throw error;
    }
  }

  /**
   * Verifica che il provider sia configurato correttamente
   */
  isConfigured(): boolean {
    return this.isInitialized && 
           !!this.config.binaryPath && 
           !!this.config.modelsPath && 
           this.availableModels.length > 0;
  }

  /**
   * Chiamata sincrona al modello
   */
  async call(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    if (!this.isConfigured()) {
      await this.initialize();
      if (!this.isConfigured()) {
        throw new Error('GGUFProvider non configurato correttamente');
      }
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      const prompt = this.formatMessagesToString(processedMessages);
      
      // Determina quale modello usare
      const modelName = options?.model || this.availableModels[0];
      const modelPath = path.join(this.config.modelsPath, `${modelName}.gguf`);
      
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Modello non trovato: ${modelPath}`);
      }
      
      // Costruisci gli argomenti per il processo
      const args = [
        '-m', modelPath,
        '--temp', String(options?.temperature || 0.7),
        '-c', String(this.config.contextSize || 2048),
        '-n', String(options?.max_tokens || 512),
        '-t', String(this.config.threads || 4),
        '--color', 'false',
        '--prompt', prompt
      ];
      
      // Se ci sono stop tokens
      if (options?.stop && options.stop.length > 0) {
        args.push('--stop');
        args.push(options.stop.join(','));
      }
      
      // Esegui il processo
      const result = await this.runProcess(this.config.binaryPath, args);
      return result;
    } catch (error) {
      throw new Error(`Errore nella chiamata GGUF: ${error.message}`);
    }
  }

  /**
   * Chiamata in streaming al modello (simulata con callback)
   */
  async *stream(messages: LLMMessage[], options?: LLMOptions): AsyncGenerator<string> {
    if (!this.isConfigured()) {
      await this.initialize();
      if (!this.isConfigured()) {
        throw new Error('GGUFProvider non configurato correttamente');
      }
    }

    // Applica le opzioni MCP
    const processedMessages = this.applyMCPOptions(messages, options);
    
    try {
      const prompt = this.formatMessagesToString(processedMessages);
      
      // Determina quale modello usare
      const modelName = options?.model || this.availableModels[0];
      const modelPath = path.join(this.config.modelsPath, `${modelName}.gguf`);
      
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Modello non trovato: ${modelPath}`);
      }
      
      // Costruisci gli argomenti per il processo
      const args = [
        '-m', modelPath,
        '--temp', String(options?.temperature || 0.7),
        '-c', String(this.config.contextSize || 2048),
        '-n', String(options?.max_tokens || 512),
        '-t', String(this.config.threads || 4),
        '--color', 'false',
        '--prompt', prompt
      ];
      
      // Se ci sono stop tokens
      if (options?.stop && options.stop.length > 0) {
        args.push('--stop');
        args.push(options.stop.join(','));
      }
      
      // Esegui il processo con streaming
      const process = spawn(this.config.binaryPath, args);
      let buffer = '';
      
      // Imposta l'encoding per l'output
      process.stdout.setEncoding('utf-8');
      
      for await (const chunk of process.stdout) {
        // Divide l'output in token per simulare lo streaming
        const tokens = (chunk as string).split(/\s+/);
        for (const token of tokens) {
          if (token.trim() !== '') {
            yield token + ' ';
            
            // Pausa artificiale per simulare output naturale
            await new Promise(resolve => setTimeout(resolve, 20));
          }
        }
      }
      
      // Raccogli eventuali errori
      for await (const chunk of process.stderr) {
        buffer += chunk;
      }
      
      // Se c'è stato un errore, lancialo
      if (buffer.length > 0) {
        console.warn(`Errore GGUF: ${buffer}`);
      }
      
    } catch (error) {
      throw new Error(`Errore nello stream GGUF: ${error.message}`);
    }
  }

  /**
   * Ottiene l'elenco dei modelli disponibili
   */
  async listModels(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.availableModels;
  }

  /**
   * Formatta i messaggi in un singolo prompt testuale
   */
  protected formatMessages(messages: LLMMessage[]): string {
    return this.formatMessagesToString(messages);
  }

  /**
   * Converte i messaggi in un formato a stringa per l'inferenza GGUF
   */
  private formatMessagesToString(messages: LLMMessage[]): string {
    let formattedPrompt = '';
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          formattedPrompt += `### Sistema:\n${message.content}\n\n`;
          break;
        case 'user':
          formattedPrompt += `### Utente:\n${message.content}\n\n`;
          break;
        case 'assistant':
          formattedPrompt += `### Assistente:\n${message.content}\n\n`;
          break;
      }
    }
    
    // Aggiunge una richiesta finale che suggerisce al modello di rispondere
    formattedPrompt += '### Assistente:\n';
    
    return formattedPrompt;
  }
  
  /**
   * Esegue un processo e restituisce l'output
   */
  private runProcess(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Processo terminato con codice ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
      
      process.on('error', (err) => {
        reject(err);
      });
    });
  }
} 