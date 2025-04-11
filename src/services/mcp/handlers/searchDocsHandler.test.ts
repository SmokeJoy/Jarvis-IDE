import { jest } from '@jest/globals';
import { searchDocsHandler } from './searchDocsHandler.js';
import { SearchDocsArgs } from '../mcp.types.js';

// Mock della funzione search
jest.mock('../../../integrations/documentation/searchAdapter.js', () => ({
  search: jest.fn()
}));

// Importa il mock per usarlo nei test
import { search } from '../../../integrations/documentation/searchAdapter.js';

describe('searchDocsHandler', () => {
  // Resetta tutti i mock prima di ogni test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe restituire errore se la query di ricerca è assente', async () => {
    // Arrange
    const args: SearchDocsArgs = { query: '' };

    // Act
    const result = await searchDocsHandler(args);

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/non specificata/i);
    expect(search).not.toHaveBeenCalled();
  });

  it('dovrebbe eseguire la ricerca con successo', async () => {
    // Arrange
    const args: SearchDocsArgs = { query: 'typescript' };
    const mockResults = [
      { 
        title: 'Introduzione a TypeScript', 
        content: 'TypeScript è un linguaggio di programmazione sviluppato da Microsoft...', 
        source: 'docs/typescript/intro.md'
      },
      { 
        title: 'Tipi in TypeScript', 
        content: 'TypeScript aggiunge tipi statici a JavaScript...', 
        source: 'docs/typescript/types.md'
      }
    ];
    
    (search as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchDocsHandler(args);

    // Assert
    expect(search).toHaveBeenCalledWith('typescript', undefined);
    expect(result.success).toBe(true);
    expect(result.results).toEqual(mockResults);
  });

  it('dovrebbe rispettare il limite specificato', async () => {
    // Arrange
    const args: SearchDocsArgs = { 
      query: 'javascript', 
      limit: 5 
    };
    const mockResults = [
      { title: 'Risultato 1', content: 'Contenuto 1', source: 'source1' },
      { title: 'Risultato 2', content: 'Contenuto 2', source: 'source2' }
    ];
    
    (search as jest.Mock).mockResolvedValue(mockResults);

    // Act
    const result = await searchDocsHandler(args);

    // Assert
    expect(search).toHaveBeenCalledWith('javascript', 5);
    expect(result.success).toBe(true);
    expect(result.results).toEqual(mockResults);
  });

  it('dovrebbe gestire errori durante la ricerca', async () => {
    // Arrange
    const args: SearchDocsArgs = { query: 'errore' };
    
    (search as jest.Mock).mockRejectedValue(new Error('Errore durante la ricerca'));

    // Act
    const result = await searchDocsHandler(args);

    // Assert
    expect(search).toHaveBeenCalledWith('errore', undefined);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Errore durante la ricerca nella documentazione/i);
    expect(result.message).toMatch(/Errore durante la ricerca/i);
  });
}); 