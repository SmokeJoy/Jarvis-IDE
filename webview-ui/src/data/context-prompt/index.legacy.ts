/**
 * contextPromptManager.ts
 * 
 * Gestore centralizzato per prompt multi-slot secondo specifiche MCP.
 * Gestisce caricamento, salvataggio e reset dei prompt con persistenza locale
 * e comunicazione bidirezionale con l'estensione.
 * 
 * Versione MCP-F6: aggiunto supporto per profili di prompt multipli
 */

import { webviewBridge } from "@webview/utils/WebviewBridge";
import { 
  isExtensionPromptMessage,
  isPromptProfileUpdatedMessage,
  isWebviewMessageUnknown,
  type ExtensionPromptMessage, 
  type PromptProfile as ImportedPromptProfile,
  type ContextPrompt,
  type WebviewMessageUnknown,
  type WebviewPromptMessage,
  ExtensionMessageType
} from '@shared/messages';
import { 
  isPromptProfilesMessage,
  isPromptProfile,
  isContextPrompt
} from '@shared/messages/guards/promptMessageGuards';
import { PayloadValidationError } from '@shared/errors/PayloadValidationError';
import type { 
  ExtensionMessage,
  WebviewMessage
} from '@shared/types/webview.types';
import { WebviewMessageType } from '@shared/types/webview.types';
import logger from '@shared/utils/outputLogger';

// Crea un logger specifico per questo componente
const componentLogger = logger.createComponentLogger('ContextPromptManager');

// Chiave per lo storage locale
const STORAGE_KEYS = {
  CONTEXT_PROMPT: 'jarvis.contextPrompts',
  PROMPT_PROFILES: 'jarvis.promptProfiles',
  ACTIVE_PROFILE_ID: 'jarvis.activePromptProfileId'
} as const;

// Tipi di slot di prompt disponibili
export type PromptSlotType = keyof ContextPrompt;

// Riesporta il tipo per retrocompatibilità
export type PromptProfile = ImportedPromptProfile;

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
interface PromptState {
  promptCache: ContextPrompt;
  profilesCache: PromptProfile[] | null;
  activeProfileId: string | null;
}

let state: PromptState = {
  promptCache: DEFAULT_PROMPTS,
  profilesCache: null,
  activeProfileId: null
};

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
  const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROMPT_PROFILES);
  const storedActiveProfileId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
  
  if (storedProfiles) {
    try {
      const parsed = JSON.parse(storedProfiles);
      state.profilesCache = Array.isArray(parsed) ? parsed : [DEFAULT_PROFILE];
      
      // Verifica l'ID del profilo attivo
      state.activeProfileId = storedActiveProfileId;
      
      // Se non c'è un ID attivo o non corrisponde a nessun profilo, usa il profilo di default
      if (!state.activeProfileId || !state.profilesCache.find(p => p.id === state.activeProfileId)) {
        const defaultProfile = state.profilesCache.find(p => p.isDefault);
        state.activeProfileId = defaultProfile ? defaultProfile.id : state.profilesCache[0].id;
      }
      
      return state.profilesCache;
    } catch (error) {
      componentLogger.error('Errore nel parsing dei profili salvati:', { error });
    }
  }
  
  // Se non disponibile nel localStorage, richiedi all'estensione
  try {
    // Richiesta asincrona all'estensione
    return new Promise((resolve) => {
      // Registra un handler per la risposta
      const removeListener = webviewBridge.on('promptProfiles', (rawMsg: unknown) => {
        removeListener(); // Deregistra il listener

        // 1️⃣ Narrowing iniziale con type guard
        if (!isExtensionPromptMessage(rawMsg)) {
          componentLogger.warn('Messaggio ricevuto non valido:', { message: rawMsg });
          state.profilesCache = [DEFAULT_PROFILE];
          state.activeProfileId = DEFAULT_PROFILE.id;
          saveProfilesToLocalStorage();
          resolve([...state.profilesCache]);
          return;
        }

        // 2️⃣ Narrowing del tipo specifico
        if (rawMsg.type === ExtensionMessageType.PROMPT_PROFILES) {
          if (typeof (msg.payload as unknown) === 'object' && 
              (msg.payload as unknown) !== null && 
              'profiles' in (msg.payload as unknown) && 
              Array.isArray((msg.payload as unknown).profiles)) {
            
            const profiles = (msg.payload as unknown).profiles as PromptProfile[];
            state.profilesCache = profiles;

            const activeProfile = profiles.find((p: PromptProfile) => p.isDefault);
            state.activeProfileId = activeProfile ? activeProfile.id : profiles[0].id;

            saveProfilesToLocalStorage();
            resolve([...profiles]);
          } else {
            componentLogger.warn('Payload profiles non valido', { payload: (msg.payload as unknown) });
            state.profilesCache = [DEFAULT_PROFILE];
            state.activeProfileId = DEFAULT_PROFILE.id;
            saveProfilesToLocalStorage();
            resolve([...state.profilesCache]);
          }
        } else {
          // 3️⃣ Fallback se il messaggio non è del tipo atteso
          componentLogger.warn('Tipo messaggio non gestito:', { type: rawMsg.type });
          state.profilesCache = [DEFAULT_PROFILE];
          state.activeProfileId = DEFAULT_PROFILE.id;
          saveProfilesToLocalStorage();
          resolve([...state.profilesCache]);
        }
      });
      
      // Invia richiesta di profili
      webviewBridge.sendMessage({
        type: 'getPromptProfiles'
      });
      
      // Timeout di sicurezza
      setTimeout(() => {
        if (!state.profilesCache) {
          componentLogger.warn('Timeout nella richiesta dei profili all\'estensione, uso default');
          state.profilesCache = [DEFAULT_PROFILE];
          state.activeProfileId = DEFAULT_PROFILE.id;
          saveProfilesToLocalStorage();
          removeListener();
          resolve([...state.profilesCache]);
        } else {
          resolve([...state.profilesCache]);
        }
      }, 3000);
    });
  } catch (error) {
    componentLogger.error('Errore nel recupero dei profili dall\'estensione:', { error });
    state.profilesCache = [DEFAULT_PROFILE];
    state.activeProfileId = DEFAULT_PROFILE.id;
    saveProfilesToLocalStorage();
    return [...state.profilesCache];
  }
}

/**
 * Carica i prompt dal profilo attivo
 */
async function loadPromptsFromActiveProfile(): Promise<ContextPrompt> {
  // Se non ci sono profili inizializzati, fallo ora
  if (!state.profilesCache) {
    await initializeProfiles();
  }
  
  // Trova il profilo attivo
  const activeProfile = getActiveProfile();
  
  // Carica i prompt dal profilo attivo
  if (activeProfile) {
    state.promptCache = { ...activeProfile.contextPrompt };
    saveToLocalStorage(); // Salva anche nel localStorage per retrocompatibilità
    return state.promptCache;
  }
  
  // Fallback ai default se non c'è un profilo attivo
  state.promptCache = { ...DEFAULT_PROMPTS };
  saveToLocalStorage();
  return state.promptCache;
}

/**
 * Recupera un singolo slot di prompt dal profilo attivo
 * @param slot Tipo di slot da recuperare
 * @param fallback Facoltativo: fallback custom (per modalità 'coder' resiliente)
 */
export function getContextPromptSlot(slot: PromptSlotType, fallback?: string): string {
  if (!state.promptCache[slot] && fallback !== undefined) {
    return fallback;
  }
  return state.promptCache[slot] || '';
}

/**
 * Recupera tutti i prompt come oggetto
 */
export function getAllContextPrompts(): ContextPrompt {
  return { ...state.promptCache };
}

/**
 * Imposta un singolo slot di prompt
 */
export function setContextPromptSlot(slot: PromptSlotType, value: string): void {
  state.promptCache[slot] = value;
  
  // Aggiorna anche nel profilo attivo se disponibile
  if (state.profilesCache && state.activeProfileId) {
    const profileIndex = state.profilesCache.findIndex(p => p.id === state.activeProfileId);
    if (profileIndex >= 0) {
      state.profilesCache[profileIndex].contextPrompt[slot] = value;
      state.profilesCache[profileIndex].updatedAt = Date.now();
      saveProfilesToLocalStorage();
    }
  }
  
  // Salva in localStorage
  saveToLocalStorage();
  
  // Invia aggiornamento all'estensione
  updatePromptProfileOnExtension();
}

/**
 * Aggiorna più slot di prompt contemporaneamente
 */
export function updateContextPrompts(updates: Partial<ContextPrompt>): void {
  // Aggiorna la cache locale
  state.promptCache = { 
    ...state.promptCache,
    ...updates
  };
  
  // Aggiorna anche nel profilo attivo se disponibile
  if (state.profilesCache && state.activeProfileId) {
    const profileIndex = state.profilesCache.findIndex(p => p.id === state.activeProfileId);
    if (profileIndex >= 0) {
      state.profilesCache[profileIndex].contextPrompt = { ...state.promptCache };
      state.profilesCache[profileIndex].updatedAt = Date.now();
      saveProfilesToLocalStorage();
    }
  }
  
  // Salva in localStorage
  saveToLocalStorage();
  
  // Invia aggiornamento all'estensione
  updatePromptProfileOnExtension();
}

/**
 * Salva i prompt nel localStorage (per retrocompatibilità)
 */
function saveToLocalStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTEXT_PROMPT, JSON.stringify(state.promptCache));
  } catch (error) {
    componentLogger.error('Errore nel salvataggio dei prompt nel localStorage:', { error });
  }
}

/**
 * Salva i profili nel localStorage
 */
function saveProfilesToLocalStorage(): void {
  try {
    if (state.profilesCache) {
      localStorage.setItem(STORAGE_KEYS.PROMPT_PROFILES, JSON.stringify(state.profilesCache));
    }
    if (state.activeProfileId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, state.activeProfileId);
    }
  } catch (error) {
    componentLogger.error('Errore nel salvataggio dei profili nel localStorage:', { error });
  }
}

/**
 * Invia aggiornamento del profilo attivo all'estensione
 */
function updatePromptProfileOnExtension(): void {
  // Recupera il profilo attivo
  const activeProfile = getActiveProfile();
  if (!activeProfile) {
    componentLogger.warn('Nessun profilo attivo disponibile per l\'aggiornamento');
    return;
  }
  
  // Invia al bridge VS Code
  const message: WebviewPromptMessage = {
    type: 'updatePromptProfile' as any, // TODO: aggiornare tipo in WebviewMessageType quando disponibile
    payload: {
      profileId: activeProfile.id,
      profile: {
        ...activeProfile,
        contextPrompt: { ...state.promptCache },
        updatedAt: Date.now()
      }
    }
  };
  
  webviewBridge.sendMessage(message);
}

/**
 * Recupera tutti i profili disponibili
 */
export function getAllProfiles(): PromptProfile[] {
  return state.profilesCache ? [...state.profilesCache] : [DEFAULT_PROFILE];
}

/**
 * Recupera il profilo attivo
 */
export function getActiveProfile(): PromptProfile | undefined {
  if (!state.profilesCache || !state.activeProfileId) return undefined;
  return state.profilesCache.find(p => p.id === state.activeProfileId);
}

/**
 * Cambia il profilo attivo
 */
export async function switchProfile(profileId: string): Promise<PromptProfile | undefined> {
  if (!state.profilesCache) {
    await initializeProfiles();
    if (!state.profilesCache) {
      componentLogger.error('Impossibile inizializzare i profili');
      return undefined;
    }
  }
  
  // Trova il profilo richiesto
  const profile = state.profilesCache.find(p => p.id === profileId);
  if (!profile) {
    componentLogger.error(`Profilo con ID ${profileId} non trovato`);
    return undefined;
  }
  
  // Imposta come attivo
  state.activeProfileId = profileId;
  saveProfilesToLocalStorage();
  
  // Aggiorna i prompt dalla cache del profilo
  state.promptCache = { ...profile.contextPrompt };
  saveToLocalStorage();
  
  // Notifica l'estensione del cambio
  return new Promise((resolve) => {
    const removeListener = webviewBridge.on('promptProfileSwitched', (msg: unknown) => {
      removeListener();
      
      if (!isExtensionPromptMessage(msg)) {
        componentLogger.warn('Risposta non valida al cambio profilo:', { message: msg });
        resolve(profile);
        return;
      }
      
      // Controlliamo che ci sia un payload con profile
      if (
        (msg.payload as unknown) && 
        typeof (msg.payload as unknown) === 'object' && 
        'profile' in (msg.payload as unknown)
      ) {
        // Narrowing del tipo
        const rawProfile = (msg.payload as unknown).profile;
        
        // Verifica che il profilo abbia la struttura attesa
        if (typeof rawProfile === 'object' && rawProfile && 'id' in rawProfile) {
          const switchedProfile = rawProfile as PromptProfile;
          if (switchedProfile.id === profileId) {
            resolve(switchedProfile);
          } else {
            componentLogger.warn('ID del profilo nella risposta non corrisponde alla richiesta');
            resolve(profile);
          }
        } else {
          componentLogger.warn('Profilo non valido nella risposta');
          resolve(profile);
        }
      } else {
        componentLogger.warn('Risposta inattesa al cambio profilo:', { type: msg.type });
        resolve(profile);
      }
    });
    
    // Invia richiesta di cambio
    webviewBridge.sendMessage({
      type: 'switchPromptProfile',
      payload: {
        profileId
      }
    });
    
    // Timeout
    setTimeout(() => {
      removeListener();
      resolve(profile);
    }, 3000);
  });
}

/**
 * Crea un nuovo profilo
 */
export async function createProfile(profileData: Partial<PromptProfile>): Promise<PromptProfile | undefined> {
  if (!state.profilesCache) {
    await initializeProfiles();
  }
  
  // Crea un nuovo profilo con valori di default + valori forniti
  const newProfile: PromptProfile = {
    id: `profile_${Date.now()}`,
    name: 'Nuovo Profilo',
    description: '',
    isDefault: false,
    contextPrompt: { ...DEFAULT_PROMPTS },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...profileData
  };
  
  // Richiesta all'estensione di creare il profilo
  return new Promise((resolve) => {
    const removeListener = webviewBridge.on('promptProfileCreated', (msg: unknown) => {
      removeListener();
      
      if (!isExtensionPromptMessage(msg)) {
        componentLogger.warn('Risposta non valida alla creazione del profilo:', { message: msg });
        resolve(undefined);
        return;
      }
      
      if (msg.type === ExtensionMessageType.PROMPT_PROFILE_CREATED && 
          typeof (msg.payload as unknown) === 'object' && (msg.payload as unknown) !== null && 
          'profile' in (msg.payload as unknown)) {
        // Aggiorna la cache locale
        const createdProfile = (msg.payload as unknown).profile as PromptProfile;
        
        if (!state.profilesCache) {
          state.profilesCache = [];
        }
        
        // Aggiungi il nuovo profilo
        state.profilesCache.push(createdProfile);
        
        // Se il nuovo profilo è impostato come default, aggiorna tutti gli altri
        if (createdProfile.isDefault) {
          state.profilesCache.forEach(p => {
            if (p.id !== createdProfile.id) {
              p.isDefault = false;
            }
          });
          state.activeProfileId = createdProfile.id;
        }
        
        saveProfilesToLocalStorage();
        resolve(createdProfile);
      } else {
        componentLogger.warn('Risposta inattesa alla creazione del profilo:', { type: msg.type });
        resolve(undefined);
      }
    });
    
    // Invia richiesta di creazione
    webviewBridge.sendMessage({
      type: 'createPromptProfile',
      payload: {
        profile: newProfile
      }
    });
    
    // Timeout
    setTimeout(() => {
      removeListener();
      resolve(undefined);
    }, 3000);
  });
}

/**
 * Aggiorna un profilo esistente
 */
export async function updateProfile(profileId: string, profileData: Partial<PromptProfile>): Promise<PromptProfile | undefined> {
  if (!state.profilesCache) {
    await initializeProfiles();
    if (!state.profilesCache) {
      componentLogger.error('Impossibile inizializzare i profili');
      return undefined;
    }
  }
  
  // Trova il profilo da aggiornare
  const profileIndex = state.profilesCache.findIndex(p => p.id === profileId);
  if (profileIndex < 0) {
    componentLogger.error(`Profilo con ID ${profileId} non trovato`);
    return undefined;
  }
  
  // Crea l'aggiornamento
  const updatedProfile: PromptProfile = {
    ...state.profilesCache[profileIndex],
    ...profileData,
    id: profileId, // Mantieni l'ID originale
    updatedAt: Date.now()
  };
  
  // Richiesta all'estensione di aggiornare il profilo
  return new Promise((resolve) => {
    const removeListener = webviewBridge.on('promptProfileUpdated', (msg: unknown) => {
      removeListener();
      
      if (!isExtensionPromptMessage(msg)) {
        componentLogger.warn('Risposta non valida all\'aggiornamento del profilo:', { message: msg });
        resolve(undefined);
        return;
      }
      
      // Verifico che ci sia il payload con profile
      if (
        (msg.payload as unknown) && 
        typeof (msg.payload as unknown) === 'object' && 
        'profile' in (msg.payload as unknown)
      ) {
        // Narrowing del tipo
        const rawProfile = (msg.payload as unknown).profile;
        
        // Verifica che il profilo abbia la struttura attesa
        if (typeof rawProfile === 'object' && rawProfile && 'id' in rawProfile) {
          const updatedProfile = rawProfile as PromptProfile;
          
          // Aggiorna il profilo in cache
          if (state.profilesCache) {
            state.profilesCache[profileIndex] = updatedProfile;
          
            // Se il profilo è impostato come default, aggiorna tutti gli altri
            if (updatedProfile.isDefault) {
              state.profilesCache.forEach(p => {
                if (p.id !== updatedProfile.id) {
                  p.isDefault = false;
                }
              });
              state.activeProfileId = updatedProfile.id;
            }
          
            saveProfilesToLocalStorage();
          
            // Se è il profilo attivo, aggiorna anche i prompt
            if (state.activeProfileId === updatedProfile.id) {
              state.promptCache = { ...updatedProfile.contextPrompt };
              saveToLocalStorage();
            }
          }
          
          resolve(updatedProfile);
        } else {
          componentLogger.warn('Profilo non valido nella risposta');
          resolve(undefined);
        }
      } else {
        componentLogger.warn('Risposta inattesa all\'aggiornamento del profilo:', { type: msg.type });
        resolve(undefined);
      }
    });
    
    // Invia richiesta di aggiornamento
    webviewBridge.sendMessage({
      type: 'updatePromptProfile',
      payload: {
        profileId,
        profile: updatedProfile
      }
    });
    
    // Timeout
    setTimeout(() => {
      removeListener();
      resolve(undefined);
    }, 3000);
  });
}

/**
 * Elimina un profilo
 */
export async function deleteProfile(profileId: string): Promise<boolean> {
  if (!state.profilesCache) {
    await initializeProfiles();
    if (!state.profilesCache) {
      componentLogger.error('Impossibile inizializzare i profili');
      return false;
    }
  }
  
  // Verifica se il profilo esiste
  const profileIndex = state.profilesCache.findIndex(p => p.id === profileId);
  if (profileIndex < 0) {
    componentLogger.error(`Profilo con ID ${profileId} non trovato`);
    return false;
  }
  
  // Verifica che non sia l'unico profilo
  if (state.profilesCache.length <= 1) {
    componentLogger.error('Impossibile eliminare l\'unico profilo disponibile');
    return false;
  }
  
  // Richiesta all'estensione di eliminare il profilo
  return new Promise((resolve) => {
    const removeListener = webviewBridge.on('promptProfileDeleted', (msg: unknown) => {
      removeListener();
      
      if (!isExtensionPromptMessage(msg)) {
        componentLogger.warn('Risposta non valida all\'eliminazione del profilo:', { message: msg });
        resolve(false);
        return;
      }
      
      if (msg.type === ExtensionMessageType.PROMPT_PROFILE_DELETED && 
          typeof (msg.payload as unknown) === 'object' && (msg.payload as unknown) !== null && 
          'profile' in (msg.payload as unknown)) {
        // Aggiorna la cache locale
        const deletedProfile = (msg.payload as unknown).profile as PromptProfile;
        
        if (deletedProfile.id !== profileId) {
          componentLogger.warn('ID del profilo eliminato non corrisponde alla richiesta');
          resolve(false);
          return;
        }
        
        // Rimuovi il profilo dalla cache
        if (state.profilesCache) {
          state.profilesCache = state.profilesCache.filter(p => p.id !== profileId);
        
          // Se era il profilo attivo, passa a un altro
          if (state.activeProfileId === profileId) {
            // Cerca un profilo di default o prendi il primo
            const defaultProfile = state.profilesCache.find(p => p.isDefault);
            state.activeProfileId = defaultProfile ? defaultProfile.id : state.profilesCache[0].id;
          
            // Aggiorna promptCache
            const newActiveProfile = state.profilesCache.find(p => p.id === state.activeProfileId);
            if (newActiveProfile) {
              state.promptCache = { ...newActiveProfile.contextPrompt };
              saveToLocalStorage();
            }
          }
        
          saveProfilesToLocalStorage();
        }
        resolve(true);
      } else {
        componentLogger.warn('Risposta inattesa all\'eliminazione del profilo:', { type: msg.type });
        resolve(false);
      }
    });
    
    // Invia richiesta di eliminazione
    webviewBridge.sendMessage({
      type: 'deletePromptProfile',
      payload: {
        profileId
      }
    });
    
    // Timeout
    setTimeout(() => {
      removeListener();
      resolve(false);
    }, 3000);
  });
}

/**
 * Aggiorna il prompt del profilo attivo
 */
export async function updateActiveProfilePrompt(contextPrompt: ContextPrompt): Promise<void> {
  // Aggiorna la cache
  state.promptCache = { ...contextPrompt };
  
  // Se c'è un profilo attivo, aggiorna anche quello
  if (state.profilesCache && state.activeProfileId) {
    const profileIndex = state.profilesCache.findIndex(p => p.id === state.activeProfileId);
    if (profileIndex >= 0) {
      state.profilesCache[profileIndex].contextPrompt = { ...state.promptCache };
      state.profilesCache[profileIndex].updatedAt = Date.now();
      saveProfilesToLocalStorage();
    }
  }
  
  // Salva in localStorage
  saveToLocalStorage();
  
  // Invia aggiornamento all'estensione
  updatePromptProfileOnExtension();
}

// MAS Integration
// Gestione memoria contestuale MAS (via thread/agente)
interface MasContext {
  contextPrompt: string;
}

const masPromptMap: Record<string, Record<string, string>> = {};

// Listener globale per evento di richiesta contesto da agente MAS
window.addEventListener('MAS_CONTEXT_APPLY', (event: Event) => {
  const customEvent = event as CustomEvent<{ agentId: string; threadId: string }>;
  const detail = customEvent.detail;

  if (detail && detail.agentId && detail.threadId) {
    // Recupera prompt (qui puoi personalizzare logica recupero, qui base: usa contextPrompt associato già presente o DEFAULT)
    const contextPromptValue = getMASContextPrompt(detail.agentId, detail.threadId);
    
    // Usa l'operatore nullish coalescing per garantire che sia sempre una stringa
    const finalContextPrompt = contextPromptValue ?? DEFAULT_PROMPTS.context ?? '';

    applyContextPrompt({
      agentId: detail.agentId,
      threadId: detail.threadId,
      contextPrompt: finalContextPrompt
    });

    const appliedEvent = new CustomEvent('MAS_CONTEXT_APPLIED', { 
      detail: { 
        agentId: detail.agentId, 
        threadId: detail.threadId, 
        contextPrompt: finalContextPrompt 
      } 
    });
    window.dispatchEvent(appliedEvent);
  }
});

/**
 * Applica un contesto a un thread specifico. 
 * Se contextPrompt === '', elimina la chiave.
 */
export function applyContextPrompt(
  input: { agentId: string; threadId: string; contextPrompt: string }
): void {
  const { agentId, threadId, contextPrompt } = input;

  if(!masPromptMap[agentId]) masPromptMap[agentId] = {};

  if(contextPrompt?.trim()) {
    masPromptMap[agentId][threadId] = contextPrompt;
  } else {
    delete masPromptMap[agentId][threadId];
    if (Object.keys(masPromptMap[agentId]).length === 0) {
      delete masPromptMap[agentId];
    }
  }

  const event = new CustomEvent('MASPromptContextChanged', { 
    detail: { agentId, threadId, contextPrompt } 
  });
  window.dispatchEvent(event);

  // Invia il prompt all'estensione
  webviewBridge.sendMessage({
    type: 'MAS_CONTEXT_PROMPT_SET',
    payload: { agentId, threadId, contextPrompt }
  });
}

/**
 * Recupera il contesto associato a un thread specifico
 */
export function getMASContextPrompt(agentId: string, threadId: string): string | undefined {
  if(!masPromptMap[agentId]) return undefined;
  return masPromptMap[agentId][threadId];
}

/**
 * Reimposta un singolo slot di prompt ai valori predefiniti
 */
export function resetPromptSlot(slot: PromptSlotType): void {
  // Reimpostazione del valore al default
  state.promptCache[slot] = DEFAULT_PROMPTS[slot] || '';
  
  // Aggiorna anche nel profilo attivo se disponibile
  if (state.profilesCache && state.activeProfileId) {
    const profileIndex = state.profilesCache.findIndex(p => p.id === state.activeProfileId);
    if (profileIndex >= 0) {
      state.profilesCache[profileIndex].contextPrompt[slot] = DEFAULT_PROMPTS[slot] || '';
      state.profilesCache[profileIndex].updatedAt = Date.now();
      saveProfilesToLocalStorage();
    }
  }
  
  // Salva in localStorage
  saveToLocalStorage();
  
  // Invia aggiornamento all'estensione
  updatePromptProfileOnExtension();
}

/**
 * Reimposta tutti i prompt ai valori predefiniti
 */
export function resetAllPrompts(): void {
  // Reimpostazione di tutti i valori al default
  state.promptCache = { ...DEFAULT_PROMPTS };
  
  // Aggiorna anche nel profilo attivo se disponibile
  if (state.profilesCache && state.activeProfileId) {
    const profileIndex = state.profilesCache.findIndex(p => p.id === state.activeProfileId);
    if (profileIndex >= 0) {
      state.profilesCache[profileIndex].contextPrompt = { ...DEFAULT_PROMPTS };
      state.profilesCache[profileIndex].updatedAt = Date.now();
      saveProfilesToLocalStorage();
    }
  }
  
  // Salva in localStorage
  saveToLocalStorage();
  
  // Invia aggiornamento all'estensione
  updatePromptProfileOnExtension();
}

/**
 * Imposta un profilo come predefinito
 */
export async function setProfileAsDefault(profileId: string): Promise<boolean> {
  if (!state.profilesCache) {
    await initializeProfiles();
    if (!state.profilesCache) {
      componentLogger.error('Impossibile inizializzare i profili');
      return false;
    }
  }
  
  // Trova il profilo
  const profileIndex = state.profilesCache.findIndex(p => p.id === profileId);
  if (profileIndex < 0) {
    componentLogger.error(`Profilo con ID ${profileId} non trovato`);
    return false;
  }
  
  // Se è già predefinito, non fare nulla
  if (state.profilesCache[profileIndex].isDefault) {
    return true;
  }
  
  // Crea l'aggiornamento
  const updateData: Partial<PromptProfile> = {
    isDefault: true
  };
  
  // Usa updateProfile che gestisce già la logica del default
  const result = await updateProfile(profileId, updateData);
  return !!result;
}