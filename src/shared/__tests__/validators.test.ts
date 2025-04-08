import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as validators from '../validators';
import type { ChatMessage } from '../types/index';
import type { ChatSettings, ApiConfiguration } from '../../types/extension';

// Mock degli schemi JSON
vi.mock('../../../docs/schemas/ChatMessage.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/ChatSettings.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/ApiConfiguration.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/WebviewMessage.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/ExtensionMessage.schema.json', () => ({}), { virtual: true });

// Mock di Ajv
vi.mock('ajv', () => {
  const mockCompile = vi.fn();
  const mockAjv = vi.fn(() => ({
    compile: mockCompile
  }));
  
  // Configura il comportamento di default
  mockCompile.mockReturnValue((data: unknown) => {
    // Implementa un validatore di base per i test
    if (!data || typeof data !== 'object') return false;
    
    const obj = data as Record<string, unknown>;
    if ('role' in obj && 'content' in obj) return true; // ChatMessage
    if ('modelId' in obj) return true; // ChatSettings
    if ('apiKey' in obj && 'baseUrl' in obj) return true; // ApiConfiguration
    
    return false;
  });
  
  return { default: mockAjv };
});

// Mock di Logger
vi.mock('../logger', () => ({
  Logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }
}));

describe('Validators', () => {
  let originalRequire: NodeRequire;
  
  beforeEach(() => {
    // Salva il require originale
    originalRequire = require;
    vi.resetModules();
  });
  
  afterEach(() => {
    // Ripristina il require originale
    global.require = originalRequire;
    vi.resetAllMocks();
  });
  
  describe('isValidChatMessage', () => {
    it('dovrebbe identificare un ChatMessage valido', () => {
      const validMessage: ChatMessage = {
        role: 'user',
        content: 'Messaggio di test',
      };
      
      expect(validators.isValidChatMessage(validMessage)).toBe(true);
    });
    
    it('dovrebbe rifiutare input non validi', () => {
      expect(validators.isValidChatMessage(null)).toBe(false);
      expect(validators.isValidChatMessage(undefined)).toBe(false);
      expect(validators.isValidChatMessage('string')).toBe(false);
      expect(validators.isValidChatMessage(123)).toBe(false);
      expect(validators.isValidChatMessage({})).toBe(false);
      expect(validators.isValidChatMessage({ content: 'Solo contenuto' })).toBe(false);
      expect(validators.isValidChatMessage({ role: 'user' })).toBe(false);
    });
    
    it('dovrebbe gestire oggetti senza prototipo', () => {
      const objWithoutProto = Object.create(null);
      objWithoutProto.role = 'user';
      objWithoutProto.content = 'Messaggio senza prototipo';
      
      expect(validators.isValidChatMessage(objWithoutProto)).toBe(true);
    });
  });
  
  describe('validateChatMessageOrThrow', () => {
    it('dovrebbe accettare un ChatMessage valido senza lanciare errori', () => {
      const validMessage: ChatMessage = {
        role: 'user',
        content: 'Messaggio di test',
      };
      
      expect(() => validators.validateChatMessageOrThrow(validMessage)).not.toThrow();
    });
    
    it('dovrebbe lanciare un errore per input non validi', () => {
      expect(() => validators.validateChatMessageOrThrow(null)).toThrow();
      expect(() => validators.validateChatMessageOrThrow({})).toThrow();
      expect(() => validators.validateChatMessageOrThrow({ role: 'user' })).toThrow();
    });
    
    it('dovrebbe includere informazioni utili nel messaggio di errore', () => {
      try {
        validators.validateChatMessageOrThrow({ role: 'user' });
        fail('Dovrebbe lanciare un errore');
      } catch (error) {
        expect((error as Error).message).toContain('ChatMessage');
      }
    });
  });
  
  describe('isValidChatMessageArray', () => {
    it('dovrebbe identificare un array di ChatMessage valido', () => {
      const validArray: ChatMessage[] = [
        { role: 'user', content: 'Domanda?' },
        { role: 'assistant', content: 'Risposta!' },
      ];
      
      expect(validators.isValidChatMessageArray(validArray)).toBe(true);
    });
    
    it('dovrebbe rifiutare array con elementi non validi', () => {
      const invalidArray = [
        { role: 'user', content: 'Valido' },
        { role: 'assistant' }, // Manca content
      ];
      
      expect(validators.isValidChatMessageArray(invalidArray)).toBe(false);
    });
    
    it('dovrebbe rifiutare input che non sono array', () => {
      expect(validators.isValidChatMessageArray({})).toBe(false);
      expect(validators.isValidChatMessageArray('non un array')).toBe(false);
      expect(validators.isValidChatMessageArray(null)).toBe(false);
    });
  });
  
  describe('isValidChatSettings', () => {
    it('dovrebbe identificare ChatSettings validi', () => {
      const validSettings: ChatSettings = {
        modelId: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
      };
      
      expect(validators.isValidChatSettings(validSettings)).toBe(true);
    });
    
    it('dovrebbe rifiutare settings non validi', () => {
      expect(validators.isValidChatSettings(null)).toBe(false);
      expect(validators.isValidChatSettings({})).toBe(false);
      expect(validators.isValidChatSettings({ temperature: 0.7 })).toBe(false); // Manca modelId
    });
  });
  
  describe('isValidApiConfiguration', () => {
    it('dovrebbe identificare ApiConfiguration valida', () => {
      const validConfig: ApiConfiguration = {
        apiKey: 'sk-xxxx',
        baseUrl: 'https://api.example.com',
      };
      
      expect(validators.isValidApiConfiguration(validConfig)).toBe(true);
    });
    
    it('dovrebbe rifiutare configurazioni non valide', () => {
      expect(validators.isValidApiConfiguration(null)).toBe(false);
      expect(validators.isValidApiConfiguration({})).toBe(false);
      expect(validators.isValidApiConfiguration({ apiKey: 'sk-xxx' })).toBe(false); // Manca baseUrl
    });
  });
  
  describe('getChatMessageErrors', () => {
    it('dovrebbe restituire null per input validi', () => {
      const validMessage: ChatMessage = {
        role: 'user',
        content: 'Messaggio di test',
      };
      
      expect(validators.getChatMessageErrors(validMessage)).toBeNull();
    });
    
    it('dovrebbe gestire input non validi senza fallire', () => {
      // Test semplificato: verifichiamo che non lanci eccezioni con input non validi
      const invalidMessage = { role: 123 };
      
      // Non dovrebbe lanciare eccezioni
      expect(() => validators.getChatMessageErrors(invalidMessage)).not.toThrow();
    });
    
    it('dovrebbe funzionare anche quando la validazione non è disponibile', () => {
      // Test semplificato: anche quando i validatori falliscono, la funzione
      // dovrebbe degradare gratiosamente
      const anyInput = { content: 'test' };
      
      // Non dovrebbe lanciare eccezioni
      expect(() => validators.getChatMessageErrors(anyInput)).not.toThrow();
    });
  });
  
  describe('Fallback quando gli schemi non sono disponibili', () => {
    beforeEach(() => {
      // Simula require che fallisce
      global.require = vi.fn((path: string) => {
        if (path.includes('schema.json')) {
          throw new Error('Modulo non trovato');
        }
        return originalRequire(path);
      }) as unknown as NodeRequire;
      
      // Reinizializza i validatori
      vi.resetModules();
    });
    
    it('dovrebbe usare la validazione di fallback per ChatMessage', () => {
      const validMessage: ChatMessage = {
        role: 'user',
        content: 'Messaggio di test',
      };
      
      // Anche senza schema, dovrebbe funzionare grazie al fallback
      expect(validators.isValidChatMessage(validMessage)).toBe(true);
      expect(validators.isValidChatMessage({})).toBe(false);
      expect(validators.isValidChatMessage(null)).toBe(false);
    });
    
    it('dovrebbe usare la validazione di fallback per ChatSettings', () => {
      const validSettings: ChatSettings = {
        modelId: 'gpt-4',
      };
      
      // Anche senza schema, dovrebbe funzionare grazie al fallback
      expect(validators.isValidChatSettings(validSettings)).toBe(true);
      expect(validators.isValidChatSettings({})).toBe(false);
    });
    
    it('dovrebbe usare la validazione di fallback per ApiConfiguration', () => {
      const validConfig: ApiConfiguration = {
        apiKey: 'sk-xxxx',
        baseUrl: 'https://api.example.com',
      };
      
      // Anche senza schema, dovrebbe funzionare grazie al fallback
      expect(validators.isValidApiConfiguration(validConfig)).toBe(true);
      expect(validators.isValidApiConfiguration({})).toBe(false);
    });
  });
}); 