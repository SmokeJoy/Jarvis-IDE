/**
 * @file types.ts
 * @description Tipi utilizzati nel sistema MAS
 */

/**
 * Ruolo dell'agente nel sistema
 */
export type AgentRole = string;

/**
 * Contesto dell'agente durante l'esecuzione
 */
export interface AgentContext {
  query: string;
  history: AgentOutput[];
  memory: Record<string, any>;
  systemPrompt?: string;
  performance?: Record<string, number>;
  [key: string]: any;
}

/**
 * Output prodotto dall'agente dopo la sua esecuzione
 */
export interface AgentOutput {
  thought: string;
  message: string;
  nextAgent: AgentRole | null;
  context: AgentContext;
}

/**
 * Interfaccia di un agente nel sistema MAS
 */
export interface Agent {
  id: string;
  role: AgentRole;
  description: string;
  execute: (context: AgentContext) => Promise<AgentOutput>;
  getSystemPrompt: () => string;
}
