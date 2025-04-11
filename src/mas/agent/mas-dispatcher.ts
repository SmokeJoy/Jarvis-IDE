/**
 * @file mas-dispatcher.ts
 * @description Dispatcher per i messaggi del sistema MAS
 * @version 1.0.0
 */

import { MasMessageType } from '../../types/mas-message';
import { agentStore } from '../store/AgentStore';
import { sendToUI } from '../../utils/webviewBridge';
import { toggleAgentEnabled } from '../utils/agent-toggle';

// Interfaccia per il Memory Manager
interface MemoryManager {
  saveAgentState: (agentId: string, state: any) => Promise<boolean>;
  getAgentState: (agentId: string) => Promise<any>;
}

// Interfaccia per le opzioni del dispatcher
interface MasDispatcherOptions {
  memoryManager: MemoryManager;
}

// Interfaccia per gli agenti
interface Agent {
  status: {
    id: string;
    name: string;
    isActive: boolean;
    enabled: boolean;
    warnings: string[];
  };
  setEnabled: (enabled: boolean) => void;
  // altri metodi dell'agente...
}

/**
 * Interfaccia base per i messaggi MAS
 */
export interface MasMessage {
  type: MasMessageType | string;
  agentId?: string;
  enabled?: boolean;
  payload?: any;
}

/**
 * Classe MasDispatcher per la gestione dei messaggi del sistema MAS
 */
export class MasDispatcher {
  private agents: Record<string, Agent> = {};
  private memoryManager: MemoryManager;

  constructor(options: MasDispatcherOptions) {
    this.memoryManager = options.memoryManager;
  }

  /**
   * Inizializza un agente, recuperando il suo stato dalla memoria se disponibile
   * @param agentId ID dell'agente da inizializzare
   */
  async initializeAgent(agentId: string): Promise<void> {
    const agent = this.agents[agentId];
    if (!agent) return;

    // Recupera lo stato dell'agente dalla memoria
    const savedState = await this.memoryManager.getAgentState(agentId);
    
    // Se c'è uno stato salvato, aggiorna l'enabled state
    if (savedState && savedState.enabled !== undefined) {
      agent.setEnabled(savedState.enabled);
    }
  }

  /**
   * Gestisce un messaggio in arrivo
   * @param message Il messaggio da gestire
   */
  async handleMessage(message: MasMessage): Promise<void> {
    switch (message.type) {
      case MasMessageType.AGENT_TOGGLE_ENABLE:
        await this.handleAgentToggleEnable(message);
        break;
      
      // Altri tipi di messaggi...
      
      default:
        console.warn(`MasDispatcher: tipo di messaggio sconosciuto: ${message.type}`);
        break;
    }
  }

  /**
   * Gestisce il toggle enabled/disabled di un agente
   * @param message Il messaggio di toggle
   */
  private async handleAgentToggleEnable(message: MasMessage): Promise<void> {
    const { agentId, enabled } = message;
    if (!agentId || enabled === undefined) return;
    
    const agent = this.agents[agentId];
    if (!agent) return;
    
    // Aggiorna lo stato dell'agente
    agent.setEnabled(enabled);
    
    // Salva lo stato in memoria per persistenza
    await this.memoryManager.saveAgentState(agentId, { enabled });
  }
} 