import { vi } from 'vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock del modulo WebviewBridge PRIMA di importare il file sotto test
vi.mock('../utils/WebviewBridge', () => {
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

// Import delle type guard da @shared/messages
import { isExtensionPromptMessage, type ExtensionPromptMessage } from '@shared/messages';

// Ora importiamo dopo la mock
import * as contextPromptManager from './contextPromptManager';

import { webviewBridge } from '../utils/WebviewBridge';

/**
 * Utility helper per attendere il prossimo tick della macro‑queue
 */
function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('contextPromptManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Pulisci localStorage per ogni test
    localStorage.clear();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('dovrebbe inizializzare con i prompt predefiniti se localStorage è vuoto', async () => {
    const prompts = await contextPromptManager.initializePrompts();
    
    expect(prompts).toBeDefined();
    expect(prompts.system).toBeDefined();
    expect(prompts.user).toBeDefined();
    expect(prompts.persona).toBeDefined();
    expect(prompts.context).toBeDefined();
  });
  
  it('dovrebbe caricare profili dall\'estensione quando richiesto', async () => {
    // Mock della risposta dell'estensione
    const mockProfiles = [
      {
        id: 'test-1',
        name: 'Test Profile',
        description: 'Test description',
        isDefault: true,
        contextPrompt: {
          system: 'Test system prompt',
          user: 'Test user prompt',
          persona: 'Test persona prompt',
          context: 'Test context prompt'
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    
    // Simuliamo l'inizializzazione
    const initPromise = contextPromptManager.initializePrompts();
    
    // Emula la risposta dall'estensione 
    setTimeout(() => {
      const mockMessage: ExtensionPromptMessage = {
        type: 'promptProfiles',
        payload: { profiles: mockProfiles }
      };
      
      (webviewBridge.__mockEmit as Function)('promptProfiles', mockMessage);
    }, 50);
    
    // Attendi l'inizializzazione
    const result = await initPromise;
    
    // Verifica che i prompt siano stati caricati correttamente
    expect(result).toEqual(mockProfiles[0].contextPrompt);
    expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'getPromptProfiles' })
    );
  });
  
  it('dovrebbe gestire correttamente messaggi non conformi alla type guard', async () => {
    // Mock della risposta dell'estensione con formato errato
    const initPromise = contextPromptManager.initializePrompts();
    
    // Emula una risposta malformata
    setTimeout(() => {
      const invalidMessage = { type: 'wrongType', someData: 'invalid' };
      (webviewBridge.__mockEmit as Function)('promptProfiles', invalidMessage);
    }, 50);
    
    // Attendi l'inizializzazione con fallback ai default
    const result = await initPromise;
    
    // Verifica che siano stati usati i prompt predefiniti
    expect(result).toBeDefined();
    expect(result.system).toBeDefined();
  });
});

describe('contextPromptManager – MAS eventi', () => {
  const agentId = 'agent‑1';
  const threadId = 'thread‑1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emette MAS_CONTEXT_APPLIED e invia MAS_CONTEXT_PROMPT_SET', async () => {
    const appliedHandler = vi.fn();
    window.addEventListener('MAS_CONTEXT_APPLIED', appliedHandler);

    // Dispatch dell'evento che la Webview dovrebbe ricevere
    const detail = { agentId, threadId };
    const evt = new CustomEvent('MAS_CONTEXT_APPLY', { detail });
    window.dispatchEvent(evt);

    // Attendi che i micro‑task si svuotino
    await nextTick();

    // Verifica che l'evento sia stato propagato
    expect(appliedHandler).toHaveBeenCalledTimes(1);

    // Verifica chiamata sendMessage
    expect(webviewBridge.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MAS_CONTEXT_PROMPT_SET',
        payload: expect.objectContaining({ agentId, threadId }),
      })
    );

    window.removeEventListener('MAS_CONTEXT_APPLIED', appliedHandler);
  });
}); 