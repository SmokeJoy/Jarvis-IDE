/**
 * @file InMemoryAgentHistory.ts
 * @description Classe per la gestione della storia delle interazioni degli agenti in memoria
 */

interface AgentInteraction {
  agentId: string;
  input: unknown;
  output: unknown;
  timestamp: number;
  error?: Error;
}

export class InMemoryAgentHistory {
  private history: AgentInteraction[] = [];

  constructor() {
    // Inizializzazione vuota
  }

  /**
   * Registra una nuova interazione nella storia
   * @param interaction Interazione da registrare
   */
  public async recordInteraction(interaction: AgentInteraction): Promise<void> {
    this.history.push(interaction);
  }

  /**
   * Ottiene tutte le interazioni di un agente specifico
   * @param agentId ID dell'agente
   * @returns Interazioni dell'agente
   */
  public async getAgentInteractions(agentId: string): Promise<AgentInteraction[]> {
    return this.history.filter((i) => i.agentId === agentId);
  }

  /**
   * Ottiene tutte le interazioni in ordine cronologico
   * @returns Tutte le interazioni
   */
  public async getAllInteractions(): Promise<AgentInteraction[]> {
    return [...this.history].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Svuota la storia
   */
  public async clear(): Promise<void> {
    this.history = [];
  }
}
