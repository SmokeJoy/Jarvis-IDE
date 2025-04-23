import { vi } from 'vitest';
import { z } from 'zod';
/**
 * @file contextSearchByTagsHandler.test.ts
 * @description Test per il gestore di ricerca per tag
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextItem } from '../../types/ContextItem';
import { ContextSearchByTagsArgs } from '../../types/handler.types';
import { contextSearchByTagsHandler, searchContextsByTags } from '../contextSearchByTagsHandler';
import * as memoryUtils from '../contextInjectHandler';
import { normalizeTag } from '../contextTagHandler';

// Mock delle utility di memoria
vi.mock('../contextInjectHandler', () => ({
  getAllMemory: vi.fn(),
}));

// Mock della normalizzazione dei tag
vi.mock('../contextTagHandler', () => ({
  normalizeTag: vi.fn((tag: string) => tag.toLowerCase().trim()),
}));

describe('contextSearchByTagsHandler', () => {
  const mockContexts: Record<string, ContextItem[]> = {
    chat: [
      {
        id: 'chat-1',
        scope: 'chat',
        text: 'Test chat 1',
        timestamp: Date.now(),
        tags: ['test', 'chat', 'important'],
      },
      {
        id: 'chat-2',
        scope: 'chat',
        text: 'Test chat 2',
        timestamp: Date.now(),
        tags: ['test', 'chat'],
      },
    ],
    project: [
      {
        id: 'project-1',
        scope: 'project',
        text: 'Test project 1',
        timestamp: Date.now(),
        tags: ['test', 'project', 'important'],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock responses
    (memoryUtils.getAllMemory as any).mockReturnValue(mockContexts);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Validazione input', () => {
    it('dovrebbe rifiutare chiamate senza tags', async () => {
      const args = {} as unknown as ContextSearchByTagsArgs;

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('tags');
    });

    it('dovrebbe rifiutare tags non validi', async () => {
      const args: ContextSearchByTagsArgs = {
        tags: ['   ', '!!!', ''],
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('array non vuoto');
    });

    it('dovrebbe rifiutare scope non validi', async () => {
      const args: ContextSearchByTagsArgs = {
        tags: ['test'],
        scope: 'invalid' as any,
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Scope');
    });
  });

  describe('Ricerca tag', () => {
    it('dovrebbe trovare contesti con tag esatti', async () => {
      const args: ContextSearchByTagsArgs = {
        tags: ['test', 'chat'],
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.items).toHaveLength(2);
      expect(output.items[0].id).toBe('chat-1');
      expect(output.items[1].id).toBe('chat-2');
    });

    it('dovrebbe filtrare per scope specifico', async () => {
      const args: ContextSearchByTagsArgs = {
        tags: ['test'],
        scope: 'project',
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.items).toHaveLength(1);
      expect(output.items[0].id).toBe('project-1');
    });

    it('dovrebbe limitare il numero di risultati', async () => {
      const args: ContextSearchByTagsArgs = {
        tags: ['test'],
        limit: 1,
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.items).toHaveLength(1);
      expect(output.total).toBeGreaterThan(1);
    });

    it('dovrebbe ordinare per rilevanza', async () => {
      const args: ContextSearchByTagsArgs = {
        tags: ['important'],
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.items[0].relevanceScore).toBeGreaterThanOrEqual(output.items[1].relevanceScore);
    });
  });

  describe('Ricerca fuzzy', () => {
    it('dovrebbe trovare corrispondenze simili con soglia bassa', async () => {
      const args: ContextSearchByTagsArgs = {
        tags: ['impotant'], // Typo intenzionale
        similarityThreshold: 0.5,
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.items.some((item) => item.tags.includes('important'))).toBe(true);
    });

    it('non dovrebbe trovare corrispondenze con soglia alta', async () => {
      const args: ContextSearchByTagsArgs = {
        tags: ['impotant'], // Typo intenzionale
        similarityThreshold: 0.9,
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.items).toHaveLength(0);
    });
  });

  describe('Gestione errori', () => {
    it('dovrebbe gestire errori di ricerca', async () => {
      (memoryUtils.getAllMemory as any).mockImplementation(() => {
        throw new Error('Memory error');
      });

      const args: ContextSearchByTagsArgs = {
        tags: ['test'],
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Errore');
    });

    it('dovrebbe gestire memoria vuota', async () => {
      (memoryUtils.getAllMemory as any).mockReturnValue({});

      const args: ContextSearchByTagsArgs = {
        tags: ['test'],
      };

      const result = await contextSearchByTagsHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.items).toHaveLength(0);
    });
  });
});
