import { vi } from 'vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock del modulo WebviewBridge PRIMA di importare il file sotto test
vi.mock('../../utils/WebviewBridge', () => {
  const listeners: Record<string, ((msg: unknown) => void)[]> = {};
  return {
    webviewBridge: {
      sendMessage: vi.fn(),
      on: vi.fn<(type: string, cb: (msg: unknown) => void) => () => void>().mockImplementation((type, cb) => {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(cb);
        // Restituisce remove
        return () => {
          listeners[type] = listeners[type].filter((fn) => fn !== cb);
        };
      }),
      __mockEmit(type: string, payload: unknown) {
        listeners[type]?.forEach((cb) => cb(payload));
      },
    },
  };
});

// Import centralizzati dal barrel come da linee guida MAS
import { 
  isExtensionPromptMessage, 
  type ExtensionPromptMessage,
  type PromptProfile,
  type ContextPrompt
} from '@shared/messages';

// Import del modulo sotto test
import * as contextPromptManager from '../contextPromptManager';

// Import del webviewBridge mockato
import { webviewBridge } from '../../utils/WebviewBridge';

// Helpers per i test
function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mockProfilesResponse(profiles: PromptProfile[]): void {
  const mockMessage: ExtensionPromptMessage = {
    type: 'promptProfiles',
    payload: { profiles }
  };
  
  (webviewBridge.__mockEmit as Function)('promptProfiles', mockMessage);
}

function mockProfileResponse(type: 'promptProfileCreated' | 'promptProfileUpdated' | 'promptProfileSwitched' | 'promptProfileDeleted', profile: PromptProfile): void {
  const mockMessage: ExtensionPromptMessage = {
    type,
    payload: { profile }
  };
  
  (webviewBridge.__mockEmit as Function)(type, mockMessage);
}

describe('contextPromptManager', () => {
  // Assicura ambiente pulito per ogni test
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Inizializzazione', () => {
    it('dovrebbe inizializzare con profilo predefinito se localStorage è vuoto', async () => {
      const prompts = await contextPromptManager.initializePrompts();
      
      expect(prompts).toBeDefined();
      expect(prompts.system).toBeDefined();
      expect(prompts.user).toBeDefined();
      expect(prompts.persona).toBeDefined();
      expect(prompts.context).toBeDefined();
      
      // Verifica che sia stata inviata una richiesta all'estensione
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'getPromptProfiles' })
      );
    });
    
    it('dovrebbe caricare profili dall\'estensione e utilizzare il profilo di default', async () => {
      // Mock dei profili
      const mockProfiles: PromptProfile[] = [
        {
          id: 'test-1',
          name: 'Test Profile 1',
          description: 'Test description',
          isDefault: false,
          contextPrompt: {
            system: 'Test system prompt 1',
            user: 'Test user prompt 1',
            persona: 'Test persona prompt 1',
            context: 'Test context prompt 1'
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'test-2',
          name: 'Test Profile 2',
          description: 'Test description',
          isDefault: true, // Questo dovrebbe essere selezionato
          contextPrompt: {
            system: 'Test system prompt 2',
            user: 'Test user prompt 2',
            persona: 'Test persona prompt 2',
            context: 'Test context prompt 2'
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];
      
      // Inizia il caricamento
      const initPromise = contextPromptManager.initializePrompts();
      
      // Simula risposta dell'estensione
      setTimeout(() => mockProfilesResponse(mockProfiles), 50);
      
      // Attendi completamento
      const result = await initPromise;
      
      // Verifica che venga utilizzato il profilo di default (test-2)
      expect(result).toEqual(mockProfiles[1].contextPrompt);
      
      // Verifica lo stato del localStorage
      const storedProfiles = localStorage.getItem('jarvis.promptProfiles');
      const storedActiveId = localStorage.getItem('jarvis.activePromptProfileId');
      
      expect(storedProfiles).not.toBeNull();
      expect(storedActiveId).toBe('test-2');
      
      // Verifica che getAllProfiles restituisca entrambi i profili
      const allProfiles = contextPromptManager.getAllProfiles();
      expect(allProfiles).toHaveLength(2);
      expect(allProfiles[0].id).toBe('test-1');
      expect(allProfiles[1].id).toBe('test-2');
      
      // Verifica che getActiveProfile restituisca il profilo corretto
      const activeProfile = contextPromptManager.getActiveProfile();
      expect(activeProfile).toBeDefined();
      expect(activeProfile?.id).toBe('test-2');
    });
    
    it('dovrebbe gestire correttamente messaggi non conformi alle type guard', async () => {
      // Inizializza l'init
      const initPromise = contextPromptManager.initializePrompts();
      
      // Invia messaggio malformato senza tipo corretto
      setTimeout(() => {
        (webviewBridge.__mockEmit as Function)('promptProfiles', { 
          invalidType: 'wrongType',
          someData: 'invalid' 
        });
      }, 50);
      
      // Attendi completamento con fallback ai default
      const result = await initPromise;
      
      // Verifica che siano stati usati i default
      expect(result).toBeDefined();
      expect(result.system).toBeDefined();
      expect(result.system).toContain('Sei un assistente intelligente');
    });
  });
  
  describe('Gestione profili', () => {
    // Setup iniziale comune
    let initialProfiles: PromptProfile[];
    
    beforeEach(async () => {
      // Crea profili iniziali
      initialProfiles = [
        {
          id: 'profile-1',
          name: 'Profilo 1',
          description: 'Descrizione profilo 1',
          isDefault: true,
          contextPrompt: {
            system: 'System prompt 1',
            user: 'User prompt 1',
            persona: 'Persona prompt 1',
            context: 'Context prompt 1'
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'profile-2',
          name: 'Profilo 2',
          description: 'Descrizione profilo 2',
          isDefault: false,
          contextPrompt: {
            system: 'System prompt 2',
            user: 'User prompt 2',
            persona: 'Persona prompt 2',
            context: 'Context prompt 2'
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];
      
      // Prepara l'inizializzazione
      const initPromise = contextPromptManager.initializePrompts();
      setTimeout(() => mockProfilesResponse(initialProfiles), 50);
      await initPromise;
    });
    
    it('dovrebbe creare un nuovo profilo correttamente', async () => {
      // Dati per il nuovo profilo
      const newProfileData: Partial<PromptProfile> = {
        name: 'Nuovo Profilo',
        description: 'Nuovo profilo di test',
        isDefault: false,
        contextPrompt: {
          system: 'Nuovo system prompt',
          user: 'Nuovo user prompt',
          persona: 'Nuovo persona prompt',
          context: 'Nuovo context prompt'
        }
      };
      
      // Richiedi creazione
      const createPromise = contextPromptManager.createProfile(newProfileData);
      
      // Simula risposta dall'estensione
      setTimeout(() => {
        const completeProfile: PromptProfile = {
          id: 'profile-3',
          ...newProfileData as any,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        mockProfileResponse('promptProfileCreated', completeProfile);
      }, 50);
      
      // Attendi risultato
      const result = await createPromise;
      
      // Verifica
      expect(result).toBeDefined();
      expect(result?.id).toBe('profile-3');
      expect(result?.name).toBe('Nuovo Profilo');
      
      // Verifica che sia stato aggiunto alla cache
      const allProfiles = contextPromptManager.getAllProfiles();
      expect(allProfiles).toHaveLength(3);
      expect(allProfiles.some(p => p.id === 'profile-3')).toBe(true);
      
      // Verifica chiamata all'API
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: 'createPromptProfile',
          payload: expect.objectContaining({
            profile: expect.objectContaining({
              name: 'Nuovo Profilo'
            })
          })
        })
      );
    });
    
    it('dovrebbe aggiornare un profilo esistente', async () => {
      // Dati per l'aggiornamento
      const updateData: Partial<PromptProfile> = {
        name: 'Profilo 1 Aggiornato',
        description: 'Descrizione aggiornata',
        contextPrompt: {
          system: 'System prompt aggiornato',
          user: 'User prompt aggiornato',
          persona: 'Persona prompt aggiornato',
          context: 'Context prompt aggiornato'
        }
      };
      
      // Richiedi aggiornamento
      const updatePromise = contextPromptManager.updateProfile('profile-1', updateData);
      
      // Simula risposta dall'estensione
      setTimeout(() => {
        const updatedProfile: PromptProfile = {
          ...initialProfiles[0],
          ...updateData as any,
          updatedAt: Date.now()
        };
        mockProfileResponse('promptProfileUpdated', updatedProfile);
      }, 50);
      
      // Attendi risultato
      const result = await updatePromise;
      
      // Verifica
      expect(result).toBeDefined();
      expect(result?.id).toBe('profile-1');
      expect(result?.name).toBe('Profilo 1 Aggiornato');
      expect(result?.contextPrompt.system).toBe('System prompt aggiornato');
      
      // Verifica che sia stato aggiornato nella cache
      const allProfiles = contextPromptManager.getAllProfiles();
      const updatedInCache = allProfiles.find(p => p.id === 'profile-1');
      expect(updatedInCache?.name).toBe('Profilo 1 Aggiornato');
      
      // Verifica chiamata all'API
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: 'updatePromptProfile',
          payload: expect.objectContaining({
            profileId: 'profile-1'
          })
        })
      );
    });
    
    it('dovrebbe eliminare un profilo correttamente', async () => {
      // Richiedi eliminazione del profilo non-default
      const deletePromise = contextPromptManager.deleteProfile('profile-2');
      
      // Simula risposta dall'estensione
      setTimeout(() => {
        mockProfileResponse('promptProfileDeleted', initialProfiles[1]);
      }, 50);
      
      // Attendi risultato
      const result = await deletePromise;
      
      // Verifica
      expect(result).toBe(true);
      
      // Verifica che sia stato rimosso dalla cache
      const allProfiles = contextPromptManager.getAllProfiles();
      expect(allProfiles).toHaveLength(1);
      expect(allProfiles[0].id).toBe('profile-1');
      
      // Verifica chiamata all'API
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: 'deletePromptProfile',
          payload: expect.objectContaining({
            profileId: 'profile-2'
          })
        })
      );
    });
    
    it('dovrebbe cambiare profilo attivo correttamente', async () => {
      // Verifica profilo attivo iniziale
      let activeProfile = contextPromptManager.getActiveProfile();
      expect(activeProfile?.id).toBe('profile-1');
      
      // Richiedi cambio profilo
      const switchPromise = contextPromptManager.switchProfile('profile-2');
      
      // Simula risposta dall'estensione
      setTimeout(() => {
        mockProfileResponse('promptProfileSwitched', initialProfiles[1]);
      }, 50);
      
      // Attendi risultato
      const result = await switchPromise;
      
      // Verifica
      expect(result).toBeDefined();
      expect(result?.id).toBe('profile-2');
      
      // Verifica che il profilo attivo sia cambiato
      activeProfile = contextPromptManager.getActiveProfile();
      expect(activeProfile?.id).toBe('profile-2');
      
      // Verifica che i prompt siano cambiati
      const allPrompts = contextPromptManager.getAllContextPrompts();
      expect(allPrompts.system).toBe('System prompt 2');
      expect(allPrompts.user).toBe('User prompt 2');
      
      // Verifica chiamata all'API
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: 'switchPromptProfile',
          payload: expect.objectContaining({
            profileId: 'profile-2'
          })
        })
      );
    });
  });
  
  describe('Gestione prompt e slot', () => {
    let testProfile: PromptProfile;
    
    beforeEach(async () => {
      // Crea profilo test
      testProfile = {
        id: 'test-profile',
        name: 'Test Profile',
        description: 'Descrizione test',
        isDefault: true,
        contextPrompt: {
          system: 'System prompt test',
          user: 'User prompt test',
          persona: 'Persona prompt test',
          context: 'Context prompt test'
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Prepara l'inizializzazione
      const initPromise = contextPromptManager.initializePrompts();
      setTimeout(() => mockProfilesResponse([testProfile]), 50);
      await initPromise;
    });
    
    it('dovrebbe recuperare correttamente i singoli slot di prompt', () => {
      expect(contextPromptManager.getContextPromptSlot('system')).toBe('System prompt test');
      expect(contextPromptManager.getContextPromptSlot('user')).toBe('User prompt test');
      expect(contextPromptManager.getContextPromptSlot('persona')).toBe('Persona prompt test');
      expect(contextPromptManager.getContextPromptSlot('context')).toBe('Context prompt test');
      
      // Test fallback
      expect(contextPromptManager.getContextPromptSlot('system', 'Fallback')).toBe('System prompt test');
      
      // Test slot non definito con fallback
      const unknownSlot = 'unknown' as any;
      expect(contextPromptManager.getContextPromptSlot(unknownSlot, 'Fallback')).toBe('Fallback');
    });
    
    it('dovrebbe aggiornare correttamente un singolo slot di prompt', () => {
      // Aggiorna un singolo slot
      contextPromptManager.setContextPromptSlot('system', 'System prompt modificato');
      
      // Verifica
      expect(contextPromptManager.getContextPromptSlot('system')).toBe('System prompt modificato');
      
      // Verifica localStorage
      const storedPrompts = localStorage.getItem('jarvis.contextPrompts');
      expect(storedPrompts).not.toBeNull();
      const parsed = JSON.parse(storedPrompts!);
      expect(parsed.system).toBe('System prompt modificato');
      
      // Verifica chiamata all'API
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: 'updatePromptProfile',
          payload: expect.objectContaining({
            profileId: 'test-profile'
          })
        })
      );
    });
    
    it('dovrebbe aggiornare più slot contemporaneamente', () => {
      // Aggiorna più slot
      contextPromptManager.updateContextPrompts({
        system: 'System prompt aggiornato',
        user: 'User prompt aggiornato'
      });
      
      // Verifica
      expect(contextPromptManager.getContextPromptSlot('system')).toBe('System prompt aggiornato');
      expect(contextPromptManager.getContextPromptSlot('user')).toBe('User prompt aggiornato');
      expect(contextPromptManager.getContextPromptSlot('persona')).toBe('Persona prompt test'); // Non modificato
      
      // Verifica localStorage
      const storedPrompts = localStorage.getItem('jarvis.contextPrompts');
      expect(storedPrompts).not.toBeNull();
      const parsed = JSON.parse(storedPrompts!);
      expect(parsed.system).toBe('System prompt aggiornato');
      expect(parsed.user).toBe('User prompt aggiornato');
      
      // Verifica chiamata all'API
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: 'updatePromptProfile'
        })
      );
    });
    
    it('dovrebbe aggiornare l\'intero prompt del profilo attivo', async () => {
      // Nuovi prompt completi
      const newPrompts: ContextPrompt = {
        system: 'System completamente nuovo',
        user: 'User completamente nuovo',
        persona: 'Persona completamente nuovo',
        context: 'Context completamente nuovo'
      };
      
      // Aggiorna il prompt completo
      await contextPromptManager.updateActiveProfilePrompt(newPrompts);
      
      // Verifica tutti gli slot
      expect(contextPromptManager.getContextPromptSlot('system')).toBe('System completamente nuovo');
      expect(contextPromptManager.getContextPromptSlot('user')).toBe('User completamente nuovo');
      expect(contextPromptManager.getContextPromptSlot('persona')).toBe('Persona completamente nuovo');
      expect(contextPromptManager.getContextPromptSlot('context')).toBe('Context completamente nuovo');
      
      // Verifica chiamata all'API
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ 
          type: 'updatePromptProfile',
          payload: expect.objectContaining({
            profileId: 'test-profile',
            profile: expect.objectContaining({
              contextPrompt: newPrompts
            })
          })
        })
      );
    });
  });
  
  describe('Integrazione MAS', () => {
    it('dovrebbe gestire correttamente gli eventi MAS_CONTEXT_APPLY', async () => {
      // Spia per eventi
      const appliedSpy = vi.fn();
      window.addEventListener('MAS_CONTEXT_APPLIED', appliedSpy);
      
      // Verifica che l'applicazione dei contesti MAS funzioni
      const agentId = 'test-agent';
      const threadId = 'test-thread';
      
      // Invia evento di richiesta contesto
      const event = new CustomEvent('MAS_CONTEXT_APPLY', { 
        detail: { agentId, threadId }
      });
      window.dispatchEvent(event);
      
      // Attendi completamento asincrono
      await nextTick();
      
      // Verifica che l'evento di risposta sia stato emesso
      expect(appliedSpy).toHaveBeenCalledTimes(1);
      
      // Verifica invio messaggio WebSocket all'estensione
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MAS_CONTEXT_PROMPT_SET',
          payload: expect.objectContaining({
            agentId,
            threadId,
            contextPrompt: expect.any(String)
          })
        })
      );
      
      // Rimuovi event listener
      window.removeEventListener('MAS_CONTEXT_APPLIED', appliedSpy);
    });
    
    it('dovrebbe mantenere i prompt MAS e recuperarli correttamente', () => {
      const agentId = 'test-agent';
      const threadId = 'test-thread';
      const testPrompt = 'Contesto di test per MAS';
      
      // Inizialmente non dovrebbe esserci alcun contesto
      expect(contextPromptManager.getMASContextPrompt(agentId, threadId)).toBeUndefined();
      
      // Applica un contesto
      contextPromptManager.applyContextPrompt({
        agentId,
        threadId,
        contextPrompt: testPrompt
      });
      
      // Verifica che sia stato memorizzato
      expect(contextPromptManager.getMASContextPrompt(agentId, threadId)).toBe(testPrompt);
      
      // Verifica invio messaggio all'estensione
      expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MAS_CONTEXT_PROMPT_SET',
          payload: expect.objectContaining({
            agentId,
            threadId,
            contextPrompt: testPrompt
          })
        })
      );
      
      // Cancella il contesto impostando una stringa vuota
      contextPromptManager.applyContextPrompt({
        agentId,
        threadId,
        contextPrompt: ''
      });
      
      // Verifica che sia stato rimosso
      expect(contextPromptManager.getMASContextPrompt(agentId, threadId)).toBeUndefined();
    });
  });
}); 