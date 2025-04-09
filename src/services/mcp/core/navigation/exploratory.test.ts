import type { findExploratoryPath } from './exploratory.js.js';
import type { getContextById } from '../../../../memory/context.js.js';
import type { getContextLinks } from '../../../../memory/context_links.js.js';

// Mock delle dipendenze
jest.mock('../../../../memory/context', () => ({
  getContextById: jest.fn()
}));

jest.mock('../../../../memory/context_links', () => ({
  getContextLinks: jest.fn()
}));

describe('findExploratoryPath', () => {
  const mockContexts = {
    'ctx-1': { id: 'ctx-1', text: 'Contesto 1', tags: ['architettura'] },
    'ctx-2': { id: 'ctx-2', text: 'Contesto 2', tags: ['performance'] },
    'ctx-3': { id: 'ctx-3', text: 'Contesto 3', tags: ['deprecato'] },
    'ctx-4': { id: 'ctx-4', text: 'Contesto 4', tags: ['architettura', 'performance'] }
  };

  const mockLinks = [
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
      sourceId: 'ctx-2',
      targetId: 'ctx-4',
      relation: 'extends',
      strength: 0.9,
      metadata: { confidence: 0.8 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getContextById as jest.Mock).mockImplementation((id) => mockContexts[id]);
    (getContextLinks as jest.Mock).mockResolvedValue(mockLinks);
  });

  it('dovrebbe esplorare il grafo fino alla profondità massima', async () => {
    const result = await findExploratoryPath('ctx-1', { maxSteps: 2 });
    
    expect(result.success).toBe(true);
    expect(result.path?.nodes.length).toBeLessThanOrEqual(4); // ctx-1 + max 3 nodi
    expect(result.path?.edges.length).toBeLessThanOrEqual(3); // max 3 archi
  });

  it('dovrebbe rispettare i filtri sui tag', async () => {
    const result = await findExploratoryPath('ctx-1', {
      requireTags: ['architettura'],
      excludeTags: ['deprecato']
    });
    
    expect(result.success).toBe(true);
    expect(result.path?.nodes).not.toContainEqual(
      expect.objectContaining({ id: 'ctx-3' })
    );
    expect(result.path?.nodes).toContainEqual(
      expect.objectContaining({ id: 'ctx-4' })
    );
  });

  it('dovrebbe generare un albero valido in formato tree', async () => {
    const result = await findExploratoryPath('ctx-1', {}, true, true, 'tree');
    
    expect(result.success).toBe(true);
    expect(result.path?.edges.every(edge => 
      edge.sourceId === 'ctx-1' || 
      result.path?.edges.some(e => e.targetId === edge.sourceId)
    )).toBe(true);
  });

  it('dovrebbe preferire le relazioni specificate', async () => {
    const result = await findExploratoryPath('ctx-1', {
      preferredRelations: ['supports']
    });
    
    expect(result.success).toBe(true);
    expect(result.path?.edges[0].relation).toBe('supports');
  });

  it('dovrebbe gestire correttamente i contesti inesistenti', async () => {
    await expect(findExploratoryPath('ctx-999', {}))
      .rejects
      .toThrow('Contesto con ID ctx-999 non trovato');
  });

  it('dovrebbe includere content e metadata quando richiesto', async () => {
    const result = await findExploratoryPath('ctx-1', {}, true, true);
    
    expect(result.success).toBe(true);
    expect(result.path?.nodes[0]).toHaveProperty('text');
    expect(result.path?.edges[0]).toHaveProperty('strength');
    expect(result.path?.edges[0]).toHaveProperty('confidence');
  });

  it('dovrebbe rispettare i filtri su strength e confidence', async () => {
    const result = await findExploratoryPath('ctx-1', {
      minStrength: 0.7,
      minConfidence: 0.8
    });
    
    expect(result.success).toBe(true);
    expect(result.path?.edges.every(edge => 
      edge.strength! >= 0.7 && edge.confidence! >= 0.8
    )).toBe(true);
  });

  it('dovrebbe gestire correttamente i link bidirezionali', async () => {
    const mockLinksWithBidirectional = [
      ...mockLinks,
      {
        id: 'link-4',
        sourceId: 'ctx-2',
        targetId: 'ctx-1',
        relation: 'supports',
        strength: 0.7,
        metadata: { confidence: 0.8 }
      }
    ];

    (getContextLinks as jest.Mock).mockResolvedValueOnce(mockLinksWithBidirectional);

    const result = await findExploratoryPath('ctx-1', { bidirectional: true });
    
    expect(result.success).toBe(true);
    expect(result.path?.edges).toContainEqual(
      expect.objectContaining({
        sourceId: 'ctx-1',
        targetId: 'ctx-2'
      })
    );
    expect(result.path?.edges).toContainEqual(
      expect.objectContaining({
        sourceId: 'ctx-2',
        targetId: 'ctx-1'
      })
    );
  });

  it('dovrebbe gestire correttamente i cicli nel formato graph', async () => {
    const mockLinksWithCycle = [
      ...mockLinks,
      {
        id: 'link-4',
        sourceId: 'ctx-4',
        targetId: 'ctx-1',
        relation: 'extends',
        strength: 0.8,
        metadata: { confidence: 0.9 }
      }
    ];

    (getContextLinks as jest.Mock).mockResolvedValueOnce(mockLinksWithCycle);

    const result = await findExploratoryPath('ctx-1', {}, true, true, 'graph');
    
    expect(result.success).toBe(true);
    // Verifica che i nodi non siano duplicati
    const nodeIds = result.path?.nodes.map(n => n.id);
    expect(new Set(nodeIds).size).toBe(nodeIds?.length);
    // Verifica che il ciclo sia presente
    expect(result.path?.edges).toContainEqual(
      expect.objectContaining({
        sourceId: 'ctx-4',
        targetId: 'ctx-1'
      })
    );
  });

  it('dovrebbe ordinare i link per punteggio decrescente durante l\'esplorazione', async () => {
    const mockLinksWithScores = [
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

    (getContextLinks as jest.Mock).mockResolvedValueOnce(mockLinksWithScores);

    const result = await findExploratoryPath('ctx-1', { maxSteps: 1 });
    
    expect(result.success).toBe(true);
    // Verifica che i link siano ordinati per punteggio decrescente
    const edgeScores = result.path?.edges.map(edge => 
      edge.strength! * edge.confidence!
    );
    expect(edgeScores).toEqual(edgeScores?.sort((a, b) => b - a));
  });

  it('dovrebbe generare uno snapshot stabile per il percorso esplorativo', async () => {
    const result = await findExploratoryPath('ctx-1', { maxSteps: 2 });
    
    expect(result).toMatchSnapshot();
  });
}); 