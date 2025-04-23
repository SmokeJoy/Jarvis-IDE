/**
 * @file constants.ts
 * @description Costanti e valori predefiniti per il modulo context-prompt
 * @author dev ai 1
 */

import type { ContextPrompt, PromptProfile } from '@shared/messages';
import type { StorageKeys } from './types';

// Chiavi per lo storage locale
export const STORAGE_KEYS: StorageKeys = {
  CONTEXT_PROMPT: 'jarvis.contextPrompts',
  PROMPT_PROFILES: 'jarvis.promptProfiles',
  ACTIVE_PROFILE_ID: 'jarvis.activePromptProfileId'
} as const;

// Valori predefiniti per i prompt
export const DEFAULT_PROMPTS: Readonly<ContextPrompt> = {
  system: `Sei un assistente intelligente che aiuta nello sviluppo software.
- Rispondi in modo preciso e conciso
- Utilizza esempi di codice quando possibile
- Rispondi in italiano`,
  
  user: `In quanto utente, ti chiederò assistenza per:
- Comprendere concetti di programmazione
- Sviluppare nuovo codice
- Risolvere bug ed errori`,
  
  persona: `# Profilo Assistente
- Esperto di programmazione
- Orientato alla risoluzione dei problemi
- Stile comunicativo chiaro e diretto`,
  
  context: `# Contesto Attuale
- Progetto: Jarvis IDE
- Linguaggio: TypeScript/React
- Framework: VS Code Extension API`
};

// Profilo di prompt predefinito
export const DEFAULT_PROFILE: Readonly<PromptProfile> = {
  id: 'default',
  name: 'Profilo Predefinito',
  description: 'Profilo di prompt predefinito del sistema',
  isDefault: true,
  contextPrompt: { ...DEFAULT_PROMPTS },
  createdAt: Date.now(),
  updatedAt: Date.now()
}; 
 