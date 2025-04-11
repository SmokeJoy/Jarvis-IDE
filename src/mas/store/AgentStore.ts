/**
 * @file AgentStore.ts
 * @description Store per lo stato degli agenti nel sistema MAS
 * @version 1.0.0
 */

import { AgentStatus } from '../../types/mas-types';

/**
 * Classe singleton che gestisce lo stato degli agenti nel sistema MAS
 */
export class AgentStore {
  private static instance: AgentStore | null = null;
  private agents: Map<string, AgentStatus> = new Map();

  /**
   * Costruttore privato (pattern Singleton)
   */
  private constructor() {}

  /**
   * Ottiene l'istanza singleton dello store
   * @returns L'istanza singleton di AgentStore
   */
  public static getInstance(): AgentStore {
    if (!AgentStore.instance) {
      AgentStore.instance = new AgentStore();
    }
    return AgentStore.instance;
  }

  /**
   * Ottiene lo stato di un agente specifico
   * @param agentId ID dell'agente
   * @returns Lo stato dell'agente o undefined se non esiste
   */
  public get(agentId: string): AgentStatus | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Ottiene tutti gli agenti nello store
   * @returns Array con tutti gli stati degli agenti
   */
  public getAll(): AgentStatus[] {
    return Array.from(this.agents.values());
  }

  /**
   * Imposta lo stato di un agente
   * @param agentId ID dell'agente
   * @param state Nuovo stato dell'agente
   */
  public set(agentId: string, state: AgentStatus): void {
    this.agents.set(agentId, state);
  }

  /**
   * Aggiorna lo stato di un agente esistente
   * @param agentId ID dell'agente
   * @param updates Aggiornamenti parziali da applicare allo stato
   * @returns true se l'agente è stato aggiornato, false se non esiste
   */
  public update(agentId: string, updates: Partial<AgentStatus>): boolean {
    const currentState = this.agents.get(agentId);
    if (!currentState) {
      return false;
    }

    this.agents.set(agentId, { ...currentState, ...updates });
    return true;
  }

  /**
   * Rimuove un agente dallo store
   * @param agentId ID dell'agente da rimuovere
   * @returns true se l'agente è stato rimosso, false se non esisteva
   */
  public delete(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  /**
   * Rimuove tutti gli agenti dallo store
   */
  public clear(): void {
    this.agents.clear();
  }
}

// Esporta un'istanza singleton pronta all'uso
export const agentStore = AgentStore.getInstance(); 