/**
 * @file prompt-engine.types.ts
 * @description Tipi per il sistema di elaborazione prompt di Jarvis-IDE
 * @version 1.0.0
 */

/**
 * Modalità di esecuzione di un prompt
 */
export type PromptRunMode = 'chat' | 'completion' | 'edit' | 'stream';

/**
 * Risultato di un'elaborazione di un prompt
 */
export interface PromptResult {
  output: string;
  tokenUsage: number;
  metadata?: Record<string, unknown>;
}

/**
 * Interfaccia per una strategy del motore di prompt
 * @deprecated Da sostituire con il sistema LLMProvider
 */
export interface PromptStrategy {
  name: string;
  run(input: string, mode: PromptRunMode): Promise<PromptResult>;
} 