/**
 * Test avanzati per i validatori
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as validators from '../validators.js.js';
import type { ChatMessage } from '../types/index.js.js';
import type { ChatSettings, ApiConfiguration } from '../../types/extension.js.js';

// Mock dei moduli
vi.mock('../../utils/logger', () => ({
  Logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }
}));

// Mock degli schemi JSON
vi.mock('../../../docs/schemas/ChatMessage.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/ChatSettings.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/ApiConfiguration.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/WebviewMessage.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/ExtensionMessage.schema.json', () => ({}), { virtual: true });
vi.mock('../../../docs/schemas/ChatSession.schema.json', () => ({}), { virtual: true });

describe('Test avanzati dei validatori', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('validateChatMessageArrayOrThrow', () => {
    it('dovrebbe accettare array validi', () => {
      const validArray: ChatMessage[] = [
        { id: 'msg1', role: 'user', content: 'Domanda?', timestamp: Date.now() },
        { id: 'msg2', role: 'assistant', content: 'Risposta!', timestamp: Date.now() }
      ];
      
      expect(() => validators.validateChatMessageArrayOrThrow(validArray)).not.toThrow();
    });
    
    it('dovrebbe lanciare un errore per array con elementi non validi', () => {
      const invalidArray = [
        { id: 'msg1', role: 'user', content: 'Valido', timestamp: Date.now() },
        { role: 'unknown', content: 'Non valido', timestamp: Date.now() }, // Ruolo non valido
        { content: 'Manca il ruolo' } // Manca role e timestamp
      ];
      
      expect(() => validators.validateChatMessageArrayOrThrow(invalidArray as any)).toThrow();
    });
    
    it('dovrebbe lanciare un errore per valori che non sono array', () => {
      expect(() => validators.validateChatMessageArrayOrThrow("non un array" as any)).toThrow();
      expect(() => validators.validateChatMessageArrayOrThrow({} as any)).toThrow();
      expect(() => validators.validateChatMessageArrayOrThrow(null as any)).toThrow();
    });
  });
  
  describe('validateChatSettingsOrThrow', () => {
    it('dovrebbe accettare impostazioni valide', () => {
      const validSettings: ChatSettings = {
        fontSize: 14,
        theme: 'dark',
        modelId: 'gpt-4',
        temperature: 0.7
      };
      
      expect(() => validators.validateChatSettingsOrThrow(validSettings)).not.toThrow();
    });
    
    it('dovrebbe accettare impostazioni con campi opzionali', () => {
      const validSettings: ChatSettings = {
        fontSize: 14,
        theme: 'light',
        modelId: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9
      };
      
      expect(() => validators.validateChatSettingsOrThrow(validSettings)).not.toThrow();
    });
    
    it('dovrebbe lanciare un errore per impostazioni malformate', () => {
      expect(() => validators.validateChatSettingsOrThrow({} as any)).toThrow();
      expect(() => validators.validateChatSettingsOrThrow({ temperature: 0.7 } as any)).toThrow();
      expect(() => validators.validateChatSettingsOrThrow(null as any)).toThrow();
    });
  });
  
  describe('validateApiConfigurationOrThrow', () => {
    it('dovrebbe accettare configurazioni valide', () => {
      const validConfig: ApiConfiguration = {
        provider: 'openai',
        apiKey: 'sk-xxxx',
        baseUrl: 'https://api.example.com'
      };
      
      expect(() => validators.validateApiConfigurationOrThrow(validConfig)).not.toThrow();
    });
    
    it('dovrebbe lanciare un errore per configurazioni malformate', () => {
      expect(() => validators.validateApiConfigurationOrThrow({} as any)).toThrow();
      expect(() => validators.validateApiConfigurationOrThrow({ apiKey: 'sk-xxx' } as any)).toThrow();
      expect(() => validators.validateApiConfigurationOrThrow(null as any)).toThrow();
    });
    
    it('dovrebbe includere dettagli nell\'errore', () => {
      try {
        validators.validateApiConfigurationOrThrow({ apiKey: 'sk-xxx' } as any);
        fail('Dovrebbe lanciare un errore');
      } catch (error) {
        expect((error as Error).message).toContain('ApiConfiguration');
      }
    });
  });
  
  describe('Gestione di casi limite', () => {
    it('dovrebbe gestire oggetti con proprietà duplicate', () => {
      const json = '{"id":"msg1","role":"user","content":"test","content":"duplicata","timestamp":1623766800000}';
      const obj = JSON.parse(json);
      
      // Non dovrebbe lanciare eccezioni
      expect(() => validators.isValidChatMessage(obj)).not.toThrow();
    });
    
    it('dovrebbe gestire oggetti molto grandi', () => {
      const largeContent = 'a'.repeat(100000);
      const largeObject = {
        id: 'msg1',
        role: 'user',
        content: largeContent,
        timestamp: Date.now()
      };
      
      // Non dovrebbe lanciare eccezioni
      expect(() => validators.isValidChatMessage(largeObject)).not.toThrow();
    });
    
    it('dovrebbe gestire oggetti profondamente annidati', () => {
      let deepObject: any = { value: 'deep' };
      for (let i = 0; i < 20; i++) {
        deepObject = { nested: deepObject };
      }
      
      const nestedMessage = {
        id: 'msg1',
        role: 'user',
        content: 'test',
        timestamp: Date.now(),
        metadata: deepObject
      };
      
      // Non dovrebbe lanciare eccezioni
      expect(() => validators.isValidChatMessage(nestedMessage as any)).not.toThrow();
    });
  });
}); 