/**
 * contextPromptManager.ts
 * 
 * Gestore centralizzato per prompt multi-slot secondo specifiche MCP.
 * Gestisce caricamento, salvataggio e reset dei prompt con persistenza locale
 * e comunicazione bidirezionale con l'estensione.
 */

import { webviewBridge } from "../utils/WebviewBridge";
import { WebviewMessageType } from "../../../src/shared/types/webview.types";
import type { ContextPrompt } from "../../../src/shared/types/webview.types";

// Chiave per lo storage locale
const CONTEXT_PROMPT_STORAGE_KEY = 'jarvis.contextPrompts';

// Tipi di slot di prompt disponibili
export type PromptSlotType = keyof ContextPrompt;

// Valori predefiniti per i prompt
const DEFAULT_PROMPTS: ContextPrompt = {
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

// Stato in memoria per cache
let promptCache: ContextPrompt | null = null;

/**
 * Inizializza e carica i prompt dal localStorage o dall'estensione
 */
export async function initializePrompts(): Promise<ContextPrompt> {
  // Primo, proviamo a recuperare da localStorage
  const storedPrompts = localStorage.getItem(CONTEXT_PROMPT_STORAGE_KEY);
  
  if (storedPrompts) {
    try {
      const parsed = JSON.parse(storedPrompts);
      promptCache = { 
        system: parsed.system || DEFAULT_PROMPTS.system,
        user: parsed.user || DEFAULT_PROMPTS.user, 
        persona: parsed.persona || DEFAULT_PROMPTS.persona,
        context: parsed.context || DEFAULT_PROMPTS.context
      };
      return promptCache;
    } catch (error) {
      console.error('Errore nel parsing dei prompt salvati:', error);
    }
  }
  
  // Se non disponibile nel localStorage, richiedi all'estensione
  try {
    // Richiesta asincrona all'estensione
    return new Promise((resolve) => {
      // Registra un handler per la risposta
      const removeListener = webviewBridge.on('response', (message) => {
        if (message.id === 'get-context-prompts' || 
            (message.settings && 'contextPrompt' in message.settings)) {
          removeListener(); // Deregistra il listener
          
          if (message.settings?.contextPrompt) {
            // Se è un oggetto completo, usalo direttamente
            if (typeof message.settings.contextPrompt === 'object') {
              promptCache = {
                system: message.settings.contextPrompt.system || DEFAULT_PROMPTS.system,
                user: message.settings.contextPrompt.user || DEFAULT_PROMPTS.user,
                persona: message.settings.contextPrompt.persona || DEFAULT_PROMPTS.persona,
                context: message.settings.contextPrompt.context || DEFAULT_PROMPTS.context
              };
            } 
            // Se è una stringa (retrocompatibilità), assegnala come system prompt
            else if (typeof message.settings.contextPrompt === 'string') {
              promptCache = {
                ...DEFAULT_PROMPTS,
                system: message.settings.contextPrompt
              };
            } 
            // Altrimenti usa i default
            else {
              promptCache = { ...DEFAULT_PROMPTS };
            }
            
            // Salva nel localStorage
            saveToLocalStorage();
            
            resolve(promptCache);
          } else {
            // Se l'estensione non ha prompt, usa i default
            promptCache = { ...DEFAULT_PROMPTS };
            resolve(promptCache);
          }
        }
      });
      
      // Invia richiesta di impostazioni
      webviewBridge.sendMessage({
        type: WebviewMessageType.GET_SETTINGS,
        id: 'get-context-prompts'
      });
      
      // Timeout di sicurezza
      setTimeout(() => {
        if (!promptCache) {
          console.warn('Timeout nella richiesta dei prompt all\'estensione, uso default');
          promptCache = { ...DEFAULT_PROMPTS };
          removeListener();
          resolve(promptCache);
        }
      }, 3000);
    });
  } catch (error) {
    console.error('Errore nel recupero dei prompt dall\'estensione:', error);
    promptCache = { ...DEFAULT_PROMPTS };
    return promptCache;
  }
}

/**
 * Recupera un singolo slot di prompt
 * @param slot Tipo di slot da recuperare
 * @returns Contenuto del prompt
 */
export function getContextPromptSlot(slot: PromptSlotType): string {
  // Carica i prompt se non in cache
  if (!promptCache) {
    // Se chiamato sincronicamente prima dell'inizializzazione, usa i default
    return DEFAULT_PROMPTS[slot] || '';
  }
  
  return promptCache[slot] || DEFAULT_PROMPTS[slot] || '';
}

/**
 * Recupera tutti gli slot di prompt
 * @returns Oggetto con tutti i prompt
 */
export function getAllContextPrompts(): ContextPrompt {
  if (!promptCache) {
    return { ...DEFAULT_PROMPTS };
  }
  
  return { ...promptCache };
}

/**
 * Imposta un singolo slot di prompt
 * @param slot Tipo di slot da impostare
 * @param value Nuovo valore
 */
export function setContextPromptSlot(slot: PromptSlotType, value: string): void {
  // Assicura che la cache sia inizializzata
  if (!promptCache) {
    promptCache = { ...DEFAULT_PROMPTS };
  }
  
  // Aggiorna il valore
  promptCache[slot] = value;
  
  // Salva nel localStorage
  saveToLocalStorage();
  
  // Sincronizza con l'estensione
  syncToExtension();
}

/**
 * Aggiorna più slot contemporaneamente
 * @param updates Oggetto con gli aggiornamenti
 */
export function updateContextPrompts(updates: Partial<ContextPrompt>): void {
  // Assicura che la cache sia inizializzata
  if (!promptCache) {
    promptCache = { ...DEFAULT_PROMPTS };
  }
  
  // Aggiorna valori multipli
  promptCache = {
    ...promptCache,
    ...updates
  };
  
  // Salva nel localStorage
  saveToLocalStorage();
  
  // Sincronizza con l'estensione
  syncToExtension();
}

/**
 * Resetta tutti i prompt ai valori predefiniti
 */
export function resetAllPrompts(): void {
  promptCache = { ...DEFAULT_PROMPTS };
  
  // Salva nel localStorage
  saveToLocalStorage();
  
  // Sincronizza con l'estensione
  syncToExtension();
}

/**
 * Resetta un singolo slot al valore predefinito
 * @param slot Tipo di slot da resettare
 */
export function resetPromptSlot(slot: PromptSlotType): void {
  if (!promptCache) {
    promptCache = { ...DEFAULT_PROMPTS };
    return;
  }
  
  promptCache[slot] = DEFAULT_PROMPTS[slot];
  
  // Salva nel localStorage
  saveToLocalStorage();
  
  // Sincronizza con l'estensione
  syncToExtension();
}

/**
 * Salva i prompt nello storage locale
 */
function saveToLocalStorage(): void {
  if (promptCache) {
    try {
      localStorage.setItem(CONTEXT_PROMPT_STORAGE_KEY, JSON.stringify(promptCache));
    } catch (error) {
      console.error('Errore nel salvataggio dei prompt nel localStorage:', error);
    }
  }
}

/**
 * Sincronizza i prompt con l'estensione VS Code
 * Conforme al protocollo MCP: payload.contextPrompt
 */
function syncToExtension(): void {
  if (promptCache) {
    try {
      webviewBridge.sendMessage({
        type: WebviewMessageType.SAVE_SETTINGS,
        id: `save-context-prompts-${Date.now()}`,
        payload: {
          contextPrompt: promptCache
        }
      });
    } catch (error) {
      console.error('Errore nella sincronizzazione dei prompt con l\'estensione:', error);
    }
  }
} 