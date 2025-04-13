/**
 * @file mas-message.ts
 * @description Definizione dei tipi di messaggi per il sistema MAS
 * @version 1.0.0
 */

/**
 * Enum per i tipi di messaggi del sistema MAS
 */
export enum MasMessageType {
  // Richieste al backend
  GET_AGENTS_STATUS = 'getAgentsStatus',
  TOGGLE_AGENT_ACTIVE = 'toggleAgentActive',

  // Nuovo tipo per M9-S4
  AGENT_TOGGLE_ENABLE = 'agentToggleEnable',

  // Risposte dal backend
  AGENTS_STATUS_UPDATE = 'agentsStatusUpdate',
  AGENT_STATE_UPDATED = 'agentStateUpdated',
}
