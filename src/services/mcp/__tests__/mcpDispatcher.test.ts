import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { mcpDispatcher } from '../mcpDispatcher.js';
import * as typeGuards from '../../../shared/typeGuards.js';
import { Logger } from '../../../shared/logger.js';

// Mock delle dipendenze
vi.mock('../../../shared/typeGuards', () => ({
  safeCastAs: vi.fn(),
}));

vi.mock('../../../shared/logger', () => ({
  Logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('mcpDispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('dovrebbe rifiutare una richiesta MCP malformata', async () => {
    // Predispone safeCastAs per lanciare un errore (simulando richiesta non valida)
    const mockError = new Error('Invalid MCP request format');
    vi.spyOn(typeGuards, 'safeCastAs').mockImplementation(() => {
      throw mockError;
    });

    // Richiesta MCP malformata
    const malformedRequest = {
      // Manca il campo 'method' obbligatorio
      params: { path: '/some/path' },
      id: 123
    };

    // Esegue il dispatcher con la richiesta malformata
    const result = await mcpDispatcher(malformedRequest as any);

    // Verifica che safeCastAs sia stato chiamato
    expect(typeGuards.safeCastAs).toHaveBeenCalled();
    
    // Verifica che l'errore sia stato registrato
    expect(Logger.error).toHaveBeenCalledWith(
      expect.stringContaining('InvalidMcpRequest'),
      expect.any(Error)
    );

    // Verifica che il risultato sia un errore
    expect(result).toEqual({
      success: false,
      error: expect.any(String),
    });
  });

  it('dovrebbe elaborare correttamente una richiesta MCP valida', async () => {
    // Predispone safeCastAs per restituire un valore valido (simulando richiesta valida)
    const validRequest = {
      method: 'readFile',
      params: { path: '/valid/path.txt' },
      id: 456
    };
    
    vi.spyOn(typeGuards, 'safeCastAs').mockReturnValue(validRequest);

    // Mock della funzione handler (da implementare secondo la strutura reale)
    // Questo dipende dall'implementazione specifica di mcpDispatcher
    
    // Esegue il dispatcher con la richiesta valida
    const result = await mcpDispatcher(validRequest);

    // Verifica che safeCastAs sia stato chiamato
    expect(typeGuards.safeCastAs).toHaveBeenCalled();
    
    // Le asserzioni precise dipendono dall'implementazione di mcpDispatcher
    // Ma dovrebbe elaborare la richiesta con successo
    expect(result.success).toBe(true);
  });
}); 