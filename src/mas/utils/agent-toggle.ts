/**
 * @file agent-toggle.ts
 * @description Helper function per abilitare/disabilitare gli agenti
 * @version 1.0.0
 */

import { agentStore } from '../store/AgentStore';

/**
 * Helper function per abilitare/disabilitare un agente
 * Centralizza la logica per poter essere riutilizzata da diverse parti del sistema
 * 
 * @param agentId ID dell'agente da aggiornare
 * @param enabled Nuovo stato di abilitazione
 * @returns true se l'agente è stato aggiornato, false se non esiste
 */
export const toggleAgentEnabled = (agentId: string, enabled: boolean): boolean => {
  const agent = agentStore.get(agentId);
  if (!agent) return false;

  // Aggiorna lo stato enabled nell'agente
  agentStore.update(agentId, {
    ...agent,
    enabled
  });
  
  return true;
}; 