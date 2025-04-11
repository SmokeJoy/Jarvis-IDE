/**
 * @file contextNavigateHandler.test.ts
 * @description Test per l'handler di navigazione tra contesti
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contextNavigateHandler } from '../contextNavigateHandler';
import { ContextItem, ContextLink, NavigationOptions, NavigationResult } from '../contextNavigateHandler';
import { getMemoryContexts, getContextById } from '../../memory/context';
import { readFile } from 'fs/promises';

// Mock delle dipendenze
vi.mock('../../memory/context', () => ({
  getMemoryContexts: vi.fn(),
  getContextById: vi.fn()
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn()
}));

// Tipizzazione dei mock
const mockedGetMemoryContexts = vi.mocked(getMemoryContexts) as vi.Mock<Promise<ContextItem[]>>;
const mockedGetContextById = vi.mocked(getContextById) as vi.Mock<Promise<ContextItem | null>>;
const mockedReadFile = vi.mocked(readFile) as vi.Mock<Promise<string>>;

// Dati di test
const mockContexts: ContextItem[] = [
  {
    id: 'ctx1',
    text: 'Contesto 1',
    tags: ['tag1', 'tag2']
  },
  {
    id: 'ctx2',
    text: 'Contesto 2',
    tags: ['tag2', 'tag3']
  },
  {
    id: 'ctx3',
    text: 'Contesto 3',
    tags: ['tag3', 'tag4']
  }
];

const mockLinks: ContextLink[] = [
  {
    id: 'link1',
    sourceId: 'ctx1',
    targetId: 'ctx2',
    relation: 'related',
    bidirectional: true,
    strength: 0.8,
    metadata: {
      confidence: 0.9,
      source: 'test',
      timestamp: '2024-01-01'
    }
  },
  {
    id: 'link2',
    sourceId: 'ctx2',
    targetId: 'ctx3',
    relation: 'related',
    bidirectional: true,
    strength: 0.7,
    metadata: {
      confidence: 0.8,
      source: 'test',
      timestamp: '2024-01-01'
    }
  }
];

describe('contextNavigateHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetMemoryContexts.mockResolvedValue(mockContexts);
    mockedReadFile.mockResolvedValue(JSON.stringify(mockLinks));
    mockedGetContextById.mockImplementation(async (id: string) => 
      mockContexts.find(ctx => ctx.id === id) || null
    );
  });

  describe('Validazione input', () => {
    it('dovrebbe fallire se manca startId', async () => {
      const result = await contextNavigateHandler({} as NavigationOptions);
      expect(result.success).toBe(false);
      expect(result.error).toBe('ID del contesto di partenza mancante');
    });

    it('dovrebbe fallire con modalità non supportata', async () => {
      const result = await contextNavigateHandler({
        startId: 'ctx1',
        mode: 'invalid' as any
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Modalità di navigazione non supportata');
    });

    it('dovrebbe fallire con formato non supportato', async () => {
      const result = await contextNavigateHandler({
        startId: 'ctx1',
        format: 'invalid' as any
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Formato non supportato');
    });

    it('dovrebbe fallire con strength invalido', async () => {
      const result = await contextNavigateHandler({
        startId: 'ctx1',
        strategy: {
          minStrength: 2
        }
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('minStrength deve essere tra');
    });

    it('dovrebbe fallire con confidence invalido', async () => {
      const result = await contextNavigateHandler({
        startId: 'ctx1',
        strategy: {
          minConfidence: -1
        }
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('minConfidence deve essere tra');
    });
  });

  describe('Navigazione', () => {
    it('dovrebbe trovare il percorso più breve', async () => {
      const result = await contextNavigateHandler({
        startId: 'ctx1',
        targetId: 'ctx3',
        mode: 'shortest',
        includeContent: true,
        includeMetadata: true
      });

      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
      expect(result.path?.nodes).toHaveLength(3);
      expect(result.path?.edges).toHaveLength(2);
    });

    it('dovrebbe fallire se il contesto di partenza non esiste', async () => {
      mockedGetMemoryContexts.mockResolvedValue([]);

      const result = await contextNavigateHandler({
        startId: 'invalid',
        targetId: 'ctx3',
        mode: 'shortest'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('non trovato');
    });

    it('dovrebbe fallire se il contesto di destinazione non esiste', async () => {
      const result = await contextNavigateHandler({
        startId: 'ctx1',
        targetId: 'invalid',
        mode: 'shortest'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('non trovato');
    });

    it('dovrebbe fallire se non esiste un percorso', async () => {
      // Modifica i link per creare un grafo disconnesso
      mockedReadFile.mockResolvedValue(JSON.stringify([]));

      const result = await contextNavigateHandler({
        startId: 'ctx1',
        targetId: 'ctx3',
        mode: 'shortest'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nessun percorso trovato');
    });
  });

  describe('Gestione errori', () => {
    it('dovrebbe gestire errori di lettura file', async () => {
      mockedReadFile.mockRejectedValue(new Error('Errore di lettura'));

      const result = await contextNavigateHandler({
        startId: 'ctx1',
        targetId: 'ctx3',
        mode: 'shortest'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Errore durante la navigazione');
    });

    it('dovrebbe gestire errori sconosciuti', async () => {
      mockedGetMemoryContexts.mockRejectedValue('Errore sconosciuto');

      const result = await contextNavigateHandler({
        startId: 'ctx1',
        targetId: 'ctx3',
        mode: 'shortest'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Errore sconosciuto');
    });
  });
}); 