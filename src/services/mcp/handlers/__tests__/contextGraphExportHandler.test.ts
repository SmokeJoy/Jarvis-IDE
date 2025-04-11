/**
 * @file contextGraphExportHandler.test.ts
 * @description Test per l'handler di esportazione del grafo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextItem, ContextLink } from '../contextGraphExportHandler';
import { contextGraphExportHandler } from '../contextGraphExportHandler';
import { getMemoryContexts } from '../../../memory/context';

// Mock delle dipendenze
vi.mock('../../../memory/context', () => ({
  getMemoryContexts: vi.fn()
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn()
}));

describe('contextGraphExportHandler', () => {
  const mockContexts: ContextItem[] = [
    {
      id: 'root',
      text: 'Test root',
      tags: ['test'],
      timestamp: Date.now()
    },
    {
      id: 'child1',
      text: 'Test child 1',
      tags: ['test'],
      timestamp: Date.now()
    },
    {
      id: 'child2',
      text: 'Test child 2',
      tags: ['test'],
      timestamp: Date.now()
    }
  ];

  const mockLinks: ContextLink[] = [
    {
      id: 'link1',
      sourceId: 'root',
      targetId: 'child1',
      relation: 'contains',
      bidirectional: false,
      strength: 0.8,
      metadata: {
        confidence: 0.9,
        source: 'test',
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'link2',
      sourceId: 'root',
      targetId: 'child2',
      relation: 'contains',
      bidirectional: false,
      strength: 0.7,
      metadata: {
        confidence: 0.8,
        source: 'test',
        timestamp: new Date().toISOString()
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getMemoryContexts as any).mockResolvedValue(mockContexts);
    (readFile as any).mockResolvedValue(JSON.stringify(mockLinks));
  });

  describe('Validazione input', () => {
    it('dovrebbe rifiutare chiamate senza rootId', async () => {
      const result = await contextGraphExportHandler({} as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID radice mancante');
    });

    it('dovrebbe rifiutare formati non supportati', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        format: 'invalid' as any
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Formato non supportato');
    });

    it('dovrebbe rifiutare valori di strength non validi', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        minStrength: 2
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('minStrength deve essere tra');
    });

    it('dovrebbe rifiutare valori di confidence non validi', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        minConfidence: -1
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('minConfidence deve essere tra');
    });
  });

  describe('Esportazione grafo', () => {
    it('dovrebbe esportare in formato DOT', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        format: 'dot'
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('digraph');
      expect(result.output).toContain('root');
      expect(result.output).toContain('child1');
      expect(result.output).toContain('child2');
    });

    it('dovrebbe esportare in formato Mermaid', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        format: 'mermaid'
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('graph');
      expect(result.output).toContain('root');
      expect(result.output).toContain('child1');
      expect(result.output).toContain('child2');
    });

    it('dovrebbe esportare in formato GraphML', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        format: 'graphml'
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('<?xml');
      expect(result.output).toContain('graphml');
      expect(result.output).toContain('root');
      expect(result.output).toContain('child1');
      expect(result.output).toContain('child2');
    });

    it('dovrebbe esportare in formato JSON-LD', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        format: 'json-ld'
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('@context');
      expect(result.output).toContain('@graph');
      expect(result.output).toContain('root');
      expect(result.output).toContain('child1');
      expect(result.output).toContain('child2');
    });
  });

  describe('Filtri e opzioni', () => {
    it('dovrebbe filtrare per direzione incoming', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'child1',
        direction: 'incoming'
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('root');
      expect(result.output).not.toContain('child2');
    });

    it('dovrebbe filtrare per direzione outgoing', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        direction: 'outgoing'
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('child1');
      expect(result.output).toContain('child2');
    });

    it('dovrebbe filtrare per relazione', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        relation: 'contains'
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('child1');
      expect(result.output).toContain('child2');
    });

    it('dovrebbe filtrare per strength minima', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        minStrength: 0.75
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('child1');
      expect(result.output).not.toContain('child2');
    });

    it('dovrebbe filtrare per confidence minima', async () => {
      const result = await contextGraphExportHandler({
        rootId: 'root',
        minConfidence: 0.85
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('child1');
      expect(result.output).not.toContain('child2');
    });
  });

  describe('Gestione errori', () => {
    it('dovrebbe gestire errori di lettura file', async () => {
      (readFile as any).mockRejectedValue(new Error('File not found'));
      const result = await contextGraphExportHandler({
        rootId: 'root'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Errore durante l\'esportazione del grafo');
    });

    it('dovrebbe gestire contesto radice non trovato', async () => {
      (getMemoryContexts as any).mockResolvedValue([]);
      const result = await contextGraphExportHandler({
        rootId: 'nonexistent'
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('non trovato');
    });
  });
}); 