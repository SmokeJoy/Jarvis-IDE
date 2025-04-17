/**
 * contextPromptManager.ts
 * 
 * Gestore centralizzato per prompt multi-slot secondo specifiche MCP.
 * Gestisce caricamento, salvataggio e reset dei prompt con persistenza locale
 * e comunicazione bidirezionale con l'estensione.
 * 
 * Versione MCP-F6: aggiunto supporto per profili di prompt multipli
 */

import { webviewBridge } from "../utils/WebviewBridge";
import { WebviewMessageType } from "../../../src/shared/types/webview.types";
import type { ContextPrompt } from "../../../src/shared/types/webview.types";
import { MASEvent } from '@core/messages/events';
import { isProfileUpdatedMessage, isProfilesListMessage } from '@shared/types/profile-message-guards';

// Chiave per lo storage locale
const CONTEXT_PROMPT_STORAGE_KEY = 'jarvis.contextPrompts';
const PROMPT_PROFILES_STORAGE_KEY = 'jarvis.promptProfiles';
const ACTIVE_PROFILE_ID_STORAGE_KEY = 'jarvis.activePromptProfileId';

// Tipi di slot di prompt disponibili
export type PromptSlotType = keyof ContextPrompt;

/**
 * Interfaccia per un profilo di prompt
 */
export interface PromptProfile {
  id: string;                  // UUID o ID univoco
  name: string;                // Nome leggibile
  description?: string;        // Descrizione facoltativa
  contextPrompt: ContextPrompt; // Struttura MCP completa
  isDefault?: boolean;         // Flag per profilo attivo
  createdAt?: number;          // Data di creazione (timestamp)
  updatedAt?: number;          // Data ultimo aggiornamento (timestamp)
}

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

// Profilo di prompt predefinito
const DEFAULT_PROFILE: PromptProfile = {
  id: 'default',
  name: 'Profilo Predefinito',
  description: 'Profilo di prompt predefinito del sistema',
  isDefault: true,
  contextPrompt: { ...DEFAULT_PROMPTS },
  createdAt: Date.now(),
  updatedAt: Date.now()
};

// Stato in memoria per cache
let promptCache: ContextPrompt | null = null;
let profilesCache: PromptProfile[] | null = null;
let activeProfileId: string | null = null;

/**
 * Inizializza e carica i profili di prompt e i prompt dal localStorage o dall'estensione
 */
export async function initializePrompts(): Promise<ContextPrompt> {
  // Prima inizializza i profili
  await initializeProfiles();
  
  // Poi carica i prompt dal profilo attivo
  return loadPromptsFromActiveProfile();
}

/**
 * Inizializza i profili di prompt
 */
async function initializeProfiles(): Promise<PromptProfile[]> {
  // Primo, proviamo a recuperare da localStorage
  const storedProfiles = localStorage.getItem(PROMPT_PROFILES_STORAGE_KEY);
  const storedActiveProfileId = localStorage.getItem(ACTIVE_PROFILE_ID_STORAGE_KEY);
  
  if (storedProfiles) {
    try {
      const parsed = JSON.parse(storedProfiles);
      profilesCache = Array.isArray(parsed) ? parsed : [DEFAULT_PROFILE];
      
      // Verifica l'ID del profilo attivo
      activeProfileId = storedActiveProfileId;
      
      // Se non c'è un ID attivo o non corrisponde a nessun profilo, usa il profilo di default
      if (!activeProfileId || !profilesCache.find(p => p.id === activeProfileId)) {
        const defaultProfile = profilesCache.find(p => p.isDefault);
        activeProfileId = defaultProfile ? defaultProfile.id : profilesCache[0].id;
      }
      
      return profilesCache;
    } catch (error) {
      console.error('Errore nel parsing dei profili salvati:', error);
    }
  }
  
  // Se non disponibile nel localStorage, richiedi all'estensione
  try {
    // Richiesta asincrona all'estensione
    return new Promise((resolve) => {
      // Registra un handler per la risposta
      const removeListener = webviewBridge.on('promptProfiles', (message) => {
        removeListener(); // Deregistra il listener
        
        if (isProfilesListMessage(message)) {
          profilesCache = message.payload.profiles;
          
          // Trova il profilo attivo
          const activeProfile = profilesCache.find(p => p.isDefault);
          activeProfileId = activeProfile ? activeProfile.id : profilesCache[0].id;
          
          // Salva nel localStorage
          saveProfilesToLocalStorage();
          
          resolve(profilesCache);
        } else {
          // Se l'estensione non ha profili, usa i default
          profilesCache = [DEFAULT_PROFILE];
          activeProfileId = DEFAULT_PROFILE.id;
          saveProfilesToLocalStorage();
          resolve(profilesCache);
        }
      });
      
      // Invia richiesta di profili
      webviewBridge.sendMessage({
        type: WebviewMessageType.GET_PROMPT_PROFILES,
        id: 'get-prompt-profiles'
      });
      
      // Timeout di sicurezza
      setTimeout(() => {
        if (!profilesCache) {
          console.warn('Timeout nella richiesta dei profili all\'estensione, uso default');
          profilesCache = [DEFAULT_PROFILE];
          activeProfileId = DEFAULT_PROFILE.id;
          saveProfilesToLocalStorage();
          removeListener();
          resolve(profilesCache);
        }
      }, 3000);
    });
  } catch (error) {
    console.error('Errore nel recupero dei profili dall\'estensione:', error);
    profilesCache = [DEFAULT_PROFILE];
    activeProfileId = DEFAULT_PROFILE.id;
    saveProfilesToLocalStorage();
    return profilesCache;
  }
}

/**
 * Carica i prompt dal profilo attivo
 */
async function loadPromptsFromActiveProfile(): Promise<ContextPrompt> {
  // Se non ci sono profili inizializzati, fallo ora
  if (!profilesCache) {
    await initializeProfiles();
  }
  
  // Trova il profilo attivo
  const activeProfile = getActiveProfile();
  
  // Carica i prompt dal profilo attivo
  if (activeProfile) {
    promptCache = { ...activeProfile.contextPrompt };
    saveToLocalStorage(); // Salva anche nel localStorage per retrocompatibilità
    return promptCache;
  }
  
  // Fallback ai default se non c'è un profilo attivo
  promptCache = { ...DEFAULT_PROMPTS };
  saveToLocalStorage();
  return promptCache;
}

/**
 * Recupera un singolo slot di prompt dal profilo attivo
 * @param slot Tipo di slot da recuperare
 * @param fallback Facoltativo: fallback custom (per modalità 'coder' resiliente)
 * @returns Contenuto del prompt
 */
export function getContextPromptSlot(slot: PromptSlotType, fallback?: string): string {
  if (!promptCache) {
    // fallback resilienza coder-mode
    if (typeof fallback === 'string') return fallback;
    return DEFAULT_PROMPTS[slot] || '';
  }
  return promptCache[slot] || fallback || DEFAULT_PROMPTS[slot] || '';
}

/**
 * Recupera tutti gli slot di prompt dal profilo attivo
 * @returns Oggetto con tutti i prompt
 */
export function getAllContextPrompts(): ContextPrompt {
  if (!promptCache) {
    return { ...DEFAULT_PROMPTS };
  }
  
  return { ...promptCache };
}

/**
 * Imposta un singolo slot di prompt nel profilo attivo
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
  
  // Aggiorna il profilo attivo
  updateActiveProfile();
  
  // Sincronizza con l'estensione
  syncToExtension();
}

/**
 * Aggiorna più slot contemporaneamente nel profilo attivo
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
  
  // Aggiorna il profilo attivo
  updateActiveProfile();
  
  // Sincronizza con l'estensione
  syncToExtension();
}

/**
 * Resetta tutti i prompt ai valori predefiniti nel profilo attivo
 */
export function resetAllPrompts(): void {
  promptCache = { ...DEFAULT_PROMPTS };
  
  // Salva nel localStorage
  saveToLocalStorage();
  
  // Aggiorna il profilo attivo
  updateActiveProfile();
  
  // Sincronizza con l'estensione
  syncToExtension();
}

/**
 * Resetta un singolo slot al valore predefinito nel profilo attivo
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
  
  // Aggiorna il profilo attivo
  updateActiveProfile();
  
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
 * Salva i profili nello storage locale
 */
function saveProfilesToLocalStorage(): void {
  if (profilesCache) {
    try {
      localStorage.setItem(PROMPT_PROFILES_STORAGE_KEY, JSON.stringify(profilesCache));
      if (activeProfileId) {
        localStorage.setItem(ACTIVE_PROFILE_ID_STORAGE_KEY, activeProfileId);
      }
    } catch (error) {
      console.error('Errore nel salvataggio dei profili nel localStorage:', error);
    }
  }
}

/**
 * Sincronizza i prompt con l'estensione
 */
function syncToExtension(): void {
  if (promptCache) {
    webviewBridge.sendMessage({
      type: WebviewMessageType.SAVE_SETTINGS,
      payload: {
        contextPrompt: promptCache
      }
    });
  }
}

/**
 * Aggiorna il profilo attivo con i prompt correnti
 */
function updateActiveProfile(): void {
  if (!profilesCache || !activeProfileId || !promptCache) return;
  
  const profileIndex = profilesCache.findIndex(p => p.id === activeProfileId);
  if (profileIndex >= 0) {
    profilesCache[profileIndex].contextPrompt = { ...promptCache };
    profilesCache[profileIndex].updatedAt = Date.now();
    saveProfilesToLocalStorage();
  }
}

// =======================================================
// Nuove funzioni per la gestione dei profili (MCP-F6)
// =======================================================

/**
 * Ottiene tutti i profili di prompt
 * @returns Array di profili
 */
export function getAllProfiles(): PromptProfile[] {
  if (!profilesCache) {
    return [DEFAULT_PROFILE];
  }
  return [...profilesCache];
}

/**
 * Ottiene il profilo attivo
 * @returns Il profilo attivo
 */
export function getActiveProfile(): PromptProfile {
  if (!profilesCache || !activeProfileId) {
    return DEFAULT_PROFILE;
  }
  
  const activeProfile = profilesCache.find(p => p.id === activeProfileId);
  return activeProfile || profilesCache[0];
}

/**
 * Cambia il profilo attivo
 * @param profileId ID del profilo da attivare
 */
export async function switchProfile(profileId: string): Promise<PromptProfile> {
  if (!profilesCache) {
    await initializeProfiles();
  }
  
  const profileIndex = profilesCache!.findIndex(p => p.id === profileId);
  if (profileIndex < 0) {
    throw new Error(`Profilo con ID ${profileId} non trovato`);
  }
  
  return new Promise((resolve, reject) => {
    const removeListener = webviewBridge.on('promptProfileSwitched', (message) => {
      removeListener();
      
      if (message.error) {
        reject(new Error(message.error));
        return;
      }
      
      if (message.payload.profiles && Array.isArray(message.payload.profiles)) {
        profilesCache = message.payload.profiles;
      }
      
      if (isProfileUpdatedMessage(message) && message.payload.profile.id === profileId) {
        activeProfileId = profileId;
        
        // Aggiorna promptCache con il nuovo profilo
        const newActiveProfile = profilesCache!.find(p => p.id === profileId);
        if (newActiveProfile) {
          promptCache = { ...newActiveProfile.contextPrompt };
          saveToLocalStorage();
          saveProfilesToLocalStorage();
          resolve(newActiveProfile);
        } else {
          reject(new Error('Profilo trovato ma non caricato correttamente'));
        }
      } else {
        reject(new Error('ID profilo nella risposta non corrisponde alla richiesta'));
      }
    });
    
    // Timeout di sicurezza
    const timeoutId = setTimeout(() => {
      removeListener();
      reject(new Error('Timeout nel cambio di profilo'));
    }, 5000);
    
    // Invia richiesta di cambio profilo
    webviewBridge.sendMessage({
      type: WebviewMessageType.SWITCH_PROMPT_PROFILE,
      id: `switch-profile-${Date.now()}`,
      payload: {
        profileId
      }
    });
    postMessage({ type: 'PROFILE_UPDATE', payload: { id: profileId } })
  });
}

/**
 * Crea un nuovo profilo di prompt
 * @param profile Dati del nuovo profilo
 */
export async function createProfile(profile: Partial<PromptProfile>): Promise<PromptProfile> {
  if (!profilesCache) {
    await initializeProfiles();
  }
  
  return new Promise((resolve, reject) => {
    const removeListener = webviewBridge.on('promptProfileCreated', (message) => {
      removeListener();
      
      if (message.error) {
        reject(new Error(message.error));
        return;
      }
      
      if (isProfileUpdatedMessage(message)) {
        // Aggiorna la cache dei profili
        if (!profilesCache) {
          profilesCache = [message.payload.profile];
        } else {
          profilesCache.push(message.payload.profile);
        }
        
        // Se è il profilo di default, aggiornare anche activeProfileId
        if (message.payload.profile.isDefault) {
          activeProfileId = message.payload.profile.id;
          promptCache = { ...message.payload.profile.contextPrompt };
          saveToLocalStorage();
        }
        
        saveProfilesToLocalStorage();
        resolve(message.payload.profile);
      } else {
        reject(new Error('Profilo non creato correttamente'));
      }
    });
    
    // Timeout di sicurezza
    const timeoutId = setTimeout(() => {
      removeListener();
      reject(new Error('Timeout nella creazione del profilo'));
    }, 5000);
    
    // Invia richiesta di creazione profilo
    webviewBridge.sendMessage({
      type: WebviewMessageType.CREATE_PROMPT_PROFILE,
      id: `create-profile-${Date.now()}`,
      payload: {
        profile
      }
    });
  });
}

/**
 * Aggiorna un profilo esistente
 * @param profileId ID del profilo da aggiornare
 * @param updates Campi da aggiornare
 */
export async function updateProfile(profileId: string, updates: Partial<PromptProfile>): Promise<PromptProfile> {
  if (!profilesCache) {
    await initializeProfiles();
  }
  
  return new Promise((resolve, reject) => {
    const removeListener = webviewBridge.on('promptProfileUpdated', (message) => {
      removeListener();
      
      if (message.error) {
        reject(new Error(message.error));
        return;
      }
      
      if (message.payload.profile && message.payload.profile.id === profileId) {
        // Aggiorna la cache dei profili
        const profileIndex = profilesCache!.findIndex(p => p.id === profileId);
        if (profileIndex >= 0) {
          profilesCache![profileIndex] = message.payload.profile;
        }
        
        // Se è il profilo attivo, aggiorna anche promptCache
        if (activeProfileId === profileId) {
          promptCache = { ...message.payload.profile.contextPrompt };
          saveToLocalStorage();
        }
        
        // Se è diventato il profilo di default, aggiorna activeProfileId
        if (message.payload.profile.isDefault && activeProfileId !== profileId) {
          activeProfileId = profileId;
          promptCache = { ...message.payload.profile.contextPrompt };
          saveToLocalStorage();
        }
        
        saveProfilesToLocalStorage();
        resolve(message.payload.profile);
      } else {
        reject(new Error('Profilo non aggiornato correttamente'));
      }
    });
    
    // Timeout di sicurezza
    const timeoutId = setTimeout(() => {
      removeListener();
      reject(new Error('Timeout nell\'aggiornamento del profilo'));
    }, 5000);
    
    // Invia richiesta di aggiornamento profilo
    webviewBridge.sendMessage({
      type: WebviewMessageType.UPDATE_PROMPT_PROFILE,
      id: `update-profile-${Date.now()}`,
      payload: {
        profileId,
        profile: updates
      }
    });
  });
}

/**
 * Elimina un profilo esistente
 * @param profileId ID del profilo da eliminare
 */
export async function deleteProfile(profileId: string): Promise<void> {
  if (!profilesCache) {
    await initializeProfiles();
  }
  
  return new Promise((resolve, reject) => {
    const removeListener = webviewBridge.on('promptProfileDeleted', (message) => {
      removeListener();
      
      if (message.error) {
        reject(new Error(message.error));
        return;
      }
      
      if (isProfileUpdatedMessage(message) && message.payload.profile.id === profileId) {
        // Aggiorna la cache dei profili
        if (isProfilesListMessage(message)) {
          profilesCache = message.payload.profiles;
          
          // Trova il nuovo profilo attivo
          const defaultProfile = profilesCache.find(p => p.isDefault);
          if (defaultProfile) {
            activeProfileId = defaultProfile.id;
            promptCache = { ...defaultProfile.contextPrompt };
            saveToLocalStorage();
          }
          
          saveProfilesToLocalStorage();
        }
        
        resolve();
      } else {
        reject(new Error('ID profilo nella risposta non corrisponde alla richiesta'));
      }
    });
    
    // Timeout di sicurezza
    const timeoutId = setTimeout(() => {
      removeListener();
      reject(new Error('Timeout nell\'eliminazione del profilo'));
    }, 5000);
    
    // Invia richiesta di eliminazione profilo
    webviewBridge.sendMessage({
      type: WebviewMessageType.DELETE_PROMPT_PROFILE,
      id: `delete-profile-${Date.now()}`,
      payload: {
        profileId
      }
    });
  });
}

/**
 * Aggiorna il profilo attivo con un nuovo ContextPrompt
 * @param contextPrompt Nuovo ContextPrompt completo
 */
export async function updateActiveProfilePrompt(contextPrompt: ContextPrompt): Promise<void> {
  // Aggiorna promptCache
  promptCache = { ...contextPrompt };
  saveToLocalStorage();
  
  // Aggiorna il profilo attivo
  updateActiveProfile();
  
  // Sincronizza con l'estensione
  syncToExtension();
}

// === MAS thread/agent context ===
export type MASPromptContext = {
  agentId: string;
  threadId: string;
  contextPrompt: string;
};

// Mappa globale (lifetime sessione webview) per MAS
const masPromptMap: Record<string, Record<string, string>> = {};

// ----- MAS_CONTEXT_APPLY listener ------
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('MAS_CONTEXT_APPLY', e => {
    const detail = (e as CustomEvent).detail;
    if (detail && typeof detail.contextId === 'string') {
      // contextId validation logic here if needed
    }
    if (detail && detail.agentId && detail.threadId) {
      // Recupera prompt (qui puoi personalizzare logica recupero, qui base: usa contextPrompt associato già presente o DEFAULT)
      let contextPrompt = getMASContextPrompt(detail.agentId, detail.threadId);
      if (typeof contextPrompt !== 'string') {
        // applichiamo prompt predefinito se assente
        contextPrompt = DEFAULT_PROMPTS.context;
      }
      // Applica il prompt mediante logica già centralizzata
      applyContextPrompt({
        agentId: detail.agentId,
        threadId: detail.threadId,
        contextPrompt
      });
      // Propaga l'evento MAS_CONTEXT_APPLIED agli ascoltatori
      const appliedEvent = new CustomEvent('MAS_CONTEXT_APPLIED', { detail: { agentId: detail.agentId, threadId: detail.threadId, contextPrompt } });
      window.dispatchEvent(appliedEvent);
    }
  });
}
/**
 * Applica un prompt di contesto MAS per una coppia agentId/threadId
 * Se contextPrompt === '', elimina la chiave.
 */
export function applyContextPrompt(
  input: MASPromptContext
): void {
  const { agentId, threadId, contextPrompt } = input;
  if (!agentId || !threadId) return;
  if (!masPromptMap[agentId]) masPromptMap[agentId] = {};
  // Persiste/disabilita context
  if(contextPrompt?.trim()) {
    masPromptMap[agentId][threadId] = contextPrompt;
  } else {
    delete masPromptMap[agentId][threadId];
    // Pulisci agent se vuoto
    if (Object.keys(masPromptMap[agentId]).length === 0) {
      delete masPromptMap[agentId];
    }
  }
  // Notifica visual MAS-UI (eventualmente via eventBus o websocket)
  if(typeof window !== 'undefined' && window.dispatchEvent) {
    const event = new CustomEvent('MASPromptContextChanged', { detail: { agentId, threadId, contextPrompt } });
    window.dispatchEvent(event);
  }
  // Sincronizza con estensione (o altra logica dispatch, es: WebSocketMessageUnion)
  webviewBridge.sendMessage({
    type: 'MAS_CONTEXT_PROMPT_SET',
    payload: { agentId, threadId, contextPrompt }
  });
}

/**
 * Recupera prompt di contesto associato ad un agentId/threadId corrente
 */
export function getMASContextPrompt(agentId: string, threadId: string): string | undefined {
  return masPromptMap[agentId]?.[threadId];
}

/**
 * Funzione per fallback resiliente in modalità coder.
 * Restituisce un prompt customizzato per ambienti codegen o fallback.
 */
export function getCoderFallbackPrompt(): string {
  return (
    promptCache?.system ||
    DEFAULT_PROMPTS.system ||
    'Sei un assistente specializzato nella generazione di codice. Rispondi sempre in sintassi valida per la richiesta.'
  );
}