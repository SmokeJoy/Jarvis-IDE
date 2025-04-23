export type PromptRunMode = 'chat' | 'coder'; 

export interface PromptProfile {
  id: string; // UUID o ID univoco
  name: string; // Nome leggibile
  description?: string; // Descrizione facoltativa
  contextPrompt: ContextPrompt; // Struttura MCP completa
  isDefault?: boolean; // Flag per profilo attivo
  createdAt?: number; // Data di creazione (timestamp)
  updatedAt?: number; // Data ultimo aggiornamento (timestamp)
} 