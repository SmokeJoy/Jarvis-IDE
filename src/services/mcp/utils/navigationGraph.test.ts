import {
  calculateSemanticScore,
  buildNodeResult,
  buildEdgeResult,
  filterLinksByOptions
} from './navigationGraph.js';
import { ContextLink } from '../types.js';

describe('navigationGraph utils', () => {
  describe('calculateSemanticScore', () => {
    const mockLink: ContextLink = {
      id: 'link-1',
      sourceId: 'ctx-1',
      targetId: 'ctx-2',
      relation: 'supports',
      strength: 0.8,
      metadata: { confidence: 0.9 }
    };

    it('dovrebbe calcolare il punteggio base correttamente', () => {
      const score = calculateSemanticScore(mockLink, {});
      expect(score).toBe(0.8 * 0.9); // strength * confidence
    });

    it('dovrebbe applicare il moltiplicatore per relazioni preferite', () => {
      const score = calculateSemanticScore(mockLink, {
        preferredRelations: ['supports']
      });
      expect(score).toBe(0.8 * 0.9 * 1.5); // base * 1.5
    });

    it('dovrebbe azzerare il punteggio se strength < minStrength', () => {
      const score = calculateSemanticScore(mockLink, {
        minStrength: 0.9
      });
      expect(score).toBe(0);
    });

    it('dovrebbe azzerare il punteggio se confidence < minConfidence', () => {
      const score = calculateSemanticScore(mockLink, {
        minConfidence: 0.95
      });
      expect(score).toBe(0);
    });

    it('dovrebbe restituire 0 per link con strength e confidence insufficienti', () => {
      const mockLink: ContextLink = {
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
        relation: 'supports',
        strength: 0.4,
        metadata: { confidence: 0.5 }
      };

      const score = calculateSemanticScore(mockLink, {
        minStrength: 0.6,
        minConfidence: 0.7
      });

      expect(score).toBe(0);
    });

    it('dovrebbe ordinare i link per punteggio decrescente', () => {
      const mockLinks: ContextLink[] = [
        {
          id: 'link-1',
          sourceId: 'ctx-1',
          targetId: 'ctx-2',
          relation: 'supports',
          strength: 0.8,
          metadata: { confidence: 0.9 }
        },
        {
          id: 'link-2',
          sourceId: 'ctx-1',
          targetId: 'ctx-3',
          relation: 'explains',
          strength: 0.6,
          metadata: { confidence: 0.7 }
        },
        {
          id: 'link-3',
          sourceId: 'ctx-1',
          targetId: 'ctx-4',
          relation: 'extends',
          strength: 0.9,
          metadata: { confidence: 0.8 }
        }
      ];

      const sortedLinks = mockLinks.sort((a, b) => 
        calculateSemanticScore(b, {}) - calculateSemanticScore(a, {})
      );

      expect(sortedLinks[0].id).toBe('link-3'); // Punteggio più alto
      expect(sortedLinks[1].id).toBe('link-1');
      expect(sortedLinks[2].id).toBe('link-2'); // Punteggio più basso
    });
  });

  describe('buildNodeResult', () => {
    const mockContext = {
      id: 'ctx-1',
      text: 'Test Context',
      tags: ['test', 'mock']
    };

    it('dovrebbe includere solo id se nessun flag è true', () => {
      const result = buildNodeResult(mockContext, false, false);
      expect(result).toEqual({ id: 'ctx-1' });
    });

    it('dovrebbe includere text se includeContent è true', () => {
      const result = buildNodeResult(mockContext, true, false);
      expect(result).toEqual({
        id: 'ctx-1',
        text: 'Test Context'
      });
    });

    it('dovrebbe includere tags se includeMetadata è true', () => {
      const result = buildNodeResult(mockContext, false, true);
      expect(result).toEqual({
        id: 'ctx-1',
        tags: ['test', 'mock']
      });
    });

    it('dovrebbe includere tutti i campi se entrambi i flag sono true', () => {
      const result = buildNodeResult(mockContext, true, true);
      expect(result).toEqual(mockContext);
    });
  });

  describe('buildEdgeResult', () => {
    const mockLink: ContextLink = {
      id: 'link-1',
      sourceId: 'ctx-1',
      targetId: 'ctx-2',
      relation: 'supports',
      strength: 0.8,
      metadata: { confidence: 0.9 }
    };

    it('dovrebbe includere solo i campi base se includeMetadata è false', () => {
      const result = buildEdgeResult(mockLink, false);
      expect(result).toEqual({
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
        relation: 'supports'
      });
    });

    it('dovrebbe includere strength e confidence se includeMetadata è true', () => {
      const result = buildEdgeResult(mockLink, true);
      expect(result).toEqual({
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
        relation: 'supports',
        strength: 0.8,
        confidence: 0.9
      });
    });
  });

  describe('filterLinksByOptions', () => {
    const mockLinks: ContextLink[] = [
      {
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
        relation: 'supports',
        strength: 0.8,
        metadata: { confidence: 0.9 }
      },
      {
        id: 'link-2',
        sourceId: 'ctx-2',
        targetId: 'ctx-3',
        relation: 'explains',
        strength: 0.6,
        metadata: { confidence: 0.7 }
      }
    ];

    it('dovrebbe filtrare per minStrength', () => {
      const filtered = filterLinksByOptions(mockLinks, { minStrength: 0.7 });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('link-1');
    });

    it('dovrebbe filtrare per minConfidence', () => {
      const filtered = filterLinksByOptions(mockLinks, { minConfidence: 0.8 });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('link-1');
    });

    it('dovrebbe filtrare per entrambi i criteri', () => {
      const filtered = filterLinksByOptions(mockLinks, {
        minStrength: 0.7,
        minConfidence: 0.8
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('link-1');
    });

    it('dovrebbe restituire tutti i link se nessun filtro è specificato', () => {
      const filtered = filterLinksByOptions(mockLinks, {});
      expect(filtered).toHaveLength(2);
    });
  });
}); 