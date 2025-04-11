/**
 * Test per il modulo di esportazione CSV
 * @jest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toCSV, sessionToCSV } from '../csv.js';
import { ChatMessage } from '../../../shared/types.js';
import { ExportableSession } from '../types.js';
import { Logger } from '../../logger.js';

// Mock del logger
vi.mock('../../logger', () => ({
  Logger: {
    getInstance: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

describe('CSV Exporter', () => {
  // Dati di test
  const mockMessages: ChatMessage[] = [
    { role: 'system', content: 'Sei un assistente AI', timestamp: 1617876123000 },
    { role: 'user', content: 'Ciao, come stai?', timestamp: 1617876124000 },
    { role: 'assistant', content: 'Sto bene, grazie!', timestamp: 1617876125000 },
    { role: 'user', content: 'Dati con virgola, punto e virgola; e "virgolette"', timestamp: 1617876126000 },
    { role: 'assistant', content: 'Riga 1\nRiga 2', timestamp: 1617876127000 },
  ];
  
  const mockSession: ExportableSession = {
    messages: mockMessages,
    settings: { temperature: 0.7 },
    systemPrompt: 'Sei un assistente AI',
    timestamp: 1617876123456
  };
  
  const emptySession: ExportableSession = {
    messages: [],
    settings: { temperature: 0.7 },
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('toCSV', () => {
    it('dovrebbe generare CSV con intestazione predefinita', () => {
      const result = toCSV(mockMessages);
      
      // Verifica che ci sia l'intestazione
      expect(result.startsWith('timestamp,role,content\n')).toBe(true);
      
      // Verifica che tutte le righe siano presenti
      const lines = result.trim().split('\n');
      expect(lines.length).toBe(mockMessages.length + 1); // +1 per l'intestazione
      
      // Verifica che il formato dell'intestazione sia corretto
      expect(lines[0]).toBe('timestamp,role,content');
      
      // Verifica che i valori con virgola siano correttamente racchiusi tra virgolette
      expect(result).toContain('"Dati con virgola, punto e virgola; e ""virgolette"""');
      
      // Verifica che le newline siano gestite correttamente
      expect(result).toContain('"Riga 1\nRiga 2"');
    });
    
    it('dovrebbe rispettare il separatore personalizzato', () => {
      const result = toCSV(mockMessages, { separator: ';' });
      
      // Verifica che l'intestazione usi il separatore personalizzato
      expect(result.startsWith('timestamp;role;content\n')).toBe(true);
      
      // Verifica che tutte le righe usino il separatore personalizzato
      const firstLine = result.trim().split('\n')[1];
      expect(firstLine.split(';').length).toBe(3);
    });
    
    it('dovrebbe consentire di omettere l\'intestazione', () => {
      const result = toCSV(mockMessages, { includeHeader: false });
      
      // Nessuna intestazione
      const lines = result.trim().split('\n');
      expect(lines.length).toBe(mockMessages.length);
      
      // Il primo elemento dovrebbe essere un valore, non l'intestazione
      expect(lines[0].startsWith('2021-04-08T')).toBe(true);
    });
    
    it('dovrebbe supportare campi personalizzati', () => {
      const result = toCSV(mockMessages, { fields: ['role', 'content'] });
      
      // Verifica che l'intestazione abbia solo i campi specificati
      expect(result.startsWith('role,content\n')).toBe(true);
      
      // Verifica che ogni riga contenga solo 2 campi
      const secondLine = result.trim().split('\n')[1];
      expect(secondLine.split(',').length).toBe(2);
    });
    
    it('dovrebbe formattare i timestamp in modo personalizzato', () => {
      const result = toCSV(mockMessages, {
        timestampFormat: 'locale'
      });
      
      // Verifica che il timestamp sia formattato secondo la localizzazione
      const secondLine = result.trim().split('\n')[1];
      // Non possiamo testare il valore esatto perché dipende dalla locale
      expect(secondLine.split(',')[0]).not.toContain('T'); // Il formato ISO contiene 'T'
    });
    
    it('dovrebbe gestire errori durante la conversione', () => {
      // Mock che causa un errore
      const errorMessages = [{
        get role() { throw new Error('Errore di test'); },
        content: 'Test'
      }] as unknown as ChatMessage[];
      
      // La funzione dovrebbe lanciare un errore
      expect(() => toCSV(errorMessages)).toThrow();
      
      // Verifica che l'errore sia stato loggato
      const loggerInstance = Logger.getInstance('csvExporter');
      expect(loggerInstance.error).toHaveBeenCalled();
    });
  });
  
  describe('sessionToCSV', () => {
    it('dovrebbe convertire correttamente una sessione in CSV', () => {
      const result = sessionToCSV(mockSession);
      
      // Verifica che il risultato sia un CSV valido
      expect(result.startsWith('timestamp,role,content\n')).toBe(true);
      
      // Verifica che ci siano tutte le righe
      const lines = result.trim().split('\n');
      expect(lines.length).toBe(mockMessages.length + 1); // +1 per l'intestazione
    });
    
    it('dovrebbe gestire sessioni senza messaggi', () => {
      const result = sessionToCSV(emptySession);
      
      // Dovrebbe restituire solo l'intestazione
      expect(result).toBe('timestamp,role,content\n');
      
      // Verifica che venga emesso un warning
      const loggerInstance = Logger.getInstance('csvExporter');
      expect(loggerInstance.warn).toHaveBeenCalled();
    });
    
    it('dovrebbe passare correttamente le opzioni al convertitore', () => {
      const result = sessionToCSV(mockSession, {
        separator: ';',
        includeHeader: false,
        fields: ['role', 'content']
      });
      
      // Verifica che le opzioni siano state applicate
      const lines = result.trim().split('\n');
      expect(lines.length).toBe(mockMessages.length); // No intestazione
      expect(lines[0].split(';').length).toBe(2); // Solo role e content
    });
  });
}); 