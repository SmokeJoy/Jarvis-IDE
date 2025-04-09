import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getContextPromptSlot, 
  setContextPromptSlot, 
  resetPromptSlot,
  resetAllPrompts,
  initializePrompts,
  type PromptSlotType
} from '../contextPromptManager';

// Mock per localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    length: 0
  };
})();

// Mock per WebviewBridge
vi.mock('../../utils/WebviewBridge', () => ({
  webviewBridge: {
    sendMessage: vi.fn(),
    on: vi.fn((type, callback) => {
      // Simula una risposta immediata per i test
      if (type === 'response') {
        setTimeout(() => {
          callback({
            id: 'get-context-prompts',
            settings: {
              contextPrompt: {
                system: 'Mock system prompt',
                user: 'Mock user prompt',
                persona: 'Mock persona',
                context: 'Mock context'
              }
            }
          });
        }, 0);
      }
      
      // Restituisce una funzione per rimuovere il listener
      return vi.fn();
    })
  }
}));

describe('contextPromptManager', () => {
  beforeEach(() => {
    // Configura il mock di localStorage per il test
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    localStorageMock.clear();
  });
  
  it('dovrebbe recuperare un prompt dallo slot predefinito', () => {
    const systemPrompt = getContextPromptSlot('system');
    expect(systemPrompt).toContain('Sei un assistente intelligente');
  });
  
  it('dovrebbe impostare e recuperare un prompt in uno slot', () => {
    const testPrompt = 'Test prompt content';
    setContextPromptSlot('user', testPrompt);
    
    // Verifica che localStorage sia stato aggiornato
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Dovrebbe restituire il valore aggiornato
    const retrievedPrompt = getContextPromptSlot('user');
    expect(retrievedPrompt).toBe(testPrompt);
  });
  
  it('dovrebbe resettare un slot ai valori predefiniti', () => {
    // Prima imposta un valore personalizzato
    setContextPromptSlot('context', 'Custom context');
    
    // Reset al valore predefinito
    resetPromptSlot('context');
    
    // Verifica che sia tornato al valore predefinito
    const resetPrompt = getContextPromptSlot('context');
    expect(resetPrompt).toContain('Progetto: Jarvis IDE');
  });
  
  it('dovrebbe resettare tutti i prompt ai valori predefiniti', () => {
    // Prima imposta valori personalizzati
    setContextPromptSlot('system', 'Custom system');
    setContextPromptSlot('user', 'Custom user');
    
    // Reset di tutti i prompt
    resetAllPrompts();
    
    // Verifica che siano tornati ai valori predefiniti
    expect(getContextPromptSlot('system')).toContain('Sei un assistente intelligente');
    expect(getContextPromptSlot('user')).toContain('In quanto utente');
  });
  
  it('dovrebbe inizializzare i prompt dall\'estensione', async () => {
    // Quando initializePrompts viene chiamato, dovrebbe usare il mock di webviewBridge.on
    const prompts = await initializePrompts();
    
    // Verifica che i prompts siano stati caricati dal mock
    expect(prompts.system).toBe('Mock system prompt');
    expect(prompts.user).toBe('Mock user prompt');
    expect(prompts.persona).toBe('Mock persona');
    expect(prompts.context).toBe('Mock context');
  });
}); 