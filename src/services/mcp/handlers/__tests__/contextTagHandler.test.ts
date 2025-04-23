import { vi } from 'vitest';
import { z } from 'zod';
/**
 * @file contextTagHandler.test.ts
 * @description Test per il gestore dei tag di contesto
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextItem } from '../../types/ContextItem';
import { ContextTagArgs } from '../../types/handler.types';
import { contextTagHandler } from '../contextTagHandler';
import * as memoryUtils from '../contextInjectHandler';

// Mock delle utility di memoria
vi.mock('../contextInjectHandler', () => ({
  getAllMemory: vi.fn(),
  persistMemoryToDisk: vi.fn().mockResolvedValue(undefined),
  findContextById: vi.fn(),
}));

describe('contextTagHandler', () => {
  const mockContext: ContextItem = {
    id: 'test-123',
    scope: 'test',
    text: 'Test content',
    timestamp: Date.now(),
    tags: ['existing-tag'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock responses
    (memoryUtils.getAllMemory as any).mockReturnValue({
      test: [mockContext],
    });
    (memoryUtils.findContextById as any).mockReturnValue({
      item: mockContext,
      scope: 'test',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Validazione input', () => {
    it('dovrebbe rifiutare chiamate senza ID', async () => {
      const args = {
        tags: ['test-tag'],
      } as unknown as ContextTagArgs;

      const result = await contextTagHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('id');
    });

    it('dovrebbe rifiutare chiamate senza tags', async () => {
      const args = {
        id: 'test-123',
      } as unknown as ContextTagArgs;

      const result = await contextTagHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('tags');
    });

    it('dovrebbe rifiutare tags non validi', async () => {
      const args: ContextTagArgs = {
        id: 'test-123',
        tags: ['   ', '!!!', ''],
      };

      const result = await contextTagHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nessun tag valido');
    });
  });

  describe('Aggiunta tag', () => {
    it('dovrebbe aggiungere nuovi tag con successo', async () => {
      const args: ContextTagArgs = {
        id: 'test-123',
        tags: ['new-tag-1', 'new-tag-2'],
      };

      const result = await contextTagHandler(args);
      expect(result.success).toBe(true);
      expect(JSON.parse(result.output!)).toMatchObject({
        id: 'test-123',
        addedTags: expect.arrayContaining(['new-tag-1', 'new-tag-2']),
        allTags: expect.arrayContaining(['existing-tag', 'new-tag-1', 'new-tag-2']),
      });
      expect(memoryUtils.persistMemoryToDisk).toHaveBeenCalled();
    });

    it('dovrebbe normalizzare i tag in input', async () => {
      const args: ContextTagArgs = {
        id: 'test-123',
        tags: ['  Tag With Spaces  ', 'UPPERCASE-TAG', 'special@#chars'],
      };

      const result = await contextTagHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.addedTags).toEqual(
        expect.arrayContaining(['tag-with-spaces', 'uppercase-tag', 'specialchars'])
      );
    });

    it('dovrebbe gestire tag duplicati', async () => {
      const args: ContextTagArgs = {
        id: 'test-123',
        tags: ['existing-tag', 'existing-tag', 'new-tag'],
      };

      const result = await contextTagHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.addedTags).toEqual(['new-tag']);
      expect(output.allTags).toHaveLength(2); // existing-tag + new-tag
    });
  });

  describe('Modalità replace', () => {
    it('dovrebbe sostituire tutti i tag esistenti', async () => {
      const args: ContextTagArgs & { replace: boolean } = {
        id: 'test-123',
        tags: ['new-tag-1', 'new-tag-2'],
        replace: true,
      };

      const result = await contextTagHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.allTags).toEqual(['new-tag-1', 'new-tag-2']);
      expect(output.allTags).not.toContain('existing-tag');
    });
  });

  describe('Gestione errori', () => {
    it('dovrebbe gestire contesti non trovati', async () => {
      (memoryUtils.findContextById as any).mockReturnValue(null);

      const args: ContextTagArgs = {
        id: 'non-existent',
        tags: ['test-tag'],
      };

      const result = await contextTagHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nessun contesto trovato');
    });

    it('dovrebbe gestire errori di persistenza', async () => {
      (memoryUtils.persistMemoryToDisk as any).mockRejectedValue(new Error('Disk error'));

      const args: ContextTagArgs = {
        id: 'test-123',
        tags: ['test-tag'],
      };

      const result = await contextTagHandler(args);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Errore');
    });

    it('dovrebbe limitare il numero massimo di tag', async () => {
      const args: ContextTagArgs = {
        id: 'test-123',
        tags: Array(15)
          .fill(0)
          .map((_, i) => `tag-${i}`),
      };

      const result = await contextTagHandler(args);
      expect(result.success).toBe(true);
      const output = JSON.parse(result.output!);
      expect(output.allTags.length).toBeLessThanOrEqual(10);
    });
  });
});
