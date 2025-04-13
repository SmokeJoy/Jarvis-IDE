import { Agent, AgentRole } from './types';

/**
 * @file AgentManager.ts
 * @description Classe per la gestione degli agenti
 */
export class AgentManager {
  private agents: Map<AgentRole, Agent> = new Map();

  constructor() {
    // Inizializzazione vuota
  }

  /**
   * Registra un agente nel sistema
   * @param agent Agente da registrare
   */
  public registerAgent(agent: Agent): void {
    this.agents.set(agent.role, agent);
  }

  /**
   * Ottiene un agente dal ruolo specificato
   * @param role Ruolo dell'agente da recuperare
   * @returns L'agente se esiste, altrimenti null
   */
  public async getAgent(role: AgentRole): Promise<Agent | null> {
    return this.agents.get(role) || null;
  }

  /**
   * Ottiene tutti gli agenti registrati
   * @returns Lista di tutti gli agenti
   */
  public async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  /**
   * Rimuove un agente dal sistema
   * @param role Ruolo dell'agente da rimuovere
   */
  public removeAgent(role: AgentRole): void {
    this.agents.delete(role);
  }
}
