import { findSemanticPath, findExploratoryPath } from './contextNavigateHandler';
import { ContextLink } from '../types';
import { getContextById } from '../../memory/context';
import { getContextLinks } from '../../memory/context_links';

// Mock dei contesti
const mockContexts = {
  'ctx-1': { id: 'ctx-1', text: 'Contesto 1', tags: ['architettura', 'performance'] },
  'ctx-2': { id: 'ctx-2', text: 'Contesto 2', tags: ['architettura', 'deprecato'] },
  'ctx-3': { id: 'ctx-3', text: 'Contesto 3', tags: ['performance', 'test'] },
  'ctx-4': { id: 'ctx-4', text: 'Contesto 4', tags: ['architettura', 'performance'] },
};

// Mock di getContextById
jest.mock('../../memory/context', () => ({
  getContextById: jest.fn((id: string) => mockContexts[id] || null),
}));

// Mock di getContextLinks
jest.mock('./contextNavigateHandler', () => {
  const originalModule = jest.requireActual('./contextNavigateHandler');
  return {
    ...originalModule,
    getContextLinks: jest.fn(),
  };
});

describe('findSemanticPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe trovare il percorso ottimale considerando tag e relazioni', async () => {
    const mockLinks: ContextLink[] = [
      {
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
        relation: 'supports',
        strength: 0.8,
        metadata: { confidence: 0.9, source: 'test' },
      },
      {
        id: 'link-2',
        sourceId: 'ctx-2',
        targetId: 'ctx-4',
        relation: 'explains',
        strength: 0.7,
        metadata: { confidence: 0.8, source: 'test' },
      },
    ];

    (require('./contextNavigateHandler').getContextLinks as jest.Mock).mockResolvedValue(mockLinks);

    const result = await findSemanticPath('ctx-1', 'ctx-4', {
      requireTags: ['architettura'],
      preferredRelations: ['supports', 'explains'],
      minStrength: 0.5,
      minConfidence: 0.7,
    });

    expect(result.success).toBe(true);
    expect(result.path?.nodes).toHaveLength(3);
    expect(result.path?.edges).toHaveLength(2);
  });

  it('dovrebbe penalizzare i contesti con tag esclusi', async () => {
    const mockLinks: ContextLink[] = [
      {
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
        relation: 'supports',
        strength: 0.8,
        metadata: { confidence: 0.9, source: 'test' },
      },
      {
        id: 'link-2',
        sourceId: 'ctx-1',
        targetId: 'ctx-3',
        relation: 'explains',
        strength: 0.7,
        metadata: { confidence: 0.8, source: 'test' },
      },
    ];

    (require('./contextNavigateHandler').getContextLinks as jest.Mock).mockResolvedValue(mockLinks);

    const result = await findSemanticPath('ctx-1', 'ctx-3', {
      excludeTags: ['deprecato'],
      minStrength: 0.5,
      minConfidence: 0.7,
    });

    expect(result.success).toBe(true);
    // Dovrebbe preferire il percorso che evita ctx-2 (deprecato)
    expect(result.path?.nodes.map((n) => n.id)).toEqual(['ctx-1', 'ctx-3']);
  });

  it('dovrebbe gestire correttamente i valori mancanti di strength e confidence', async () => {
    const mockLinks: ContextLink[] = [
      {
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-3',
        relation: 'supports',
      },
    ];

    (require('./contextNavigateHandler').getContextLinks as jest.Mock).mockResolvedValue(mockLinks);

    const result = await findSemanticPath('ctx-1', 'ctx-3', {
      minStrength: 0.5,
      minConfidence: 0.7,
    });

    expect(result.success).toBe(true);
    // Dovrebbe usare i valori di default (1) per strength e confidence
    expect(result.path?.nodes).toHaveLength(2);
  });

  it('dovrebbe fallire se non trova un percorso valido', async () => {
    const mockLinks: ContextLink[] = [
      {
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
        relation: 'supports',
        strength: 0.3, // Troppo basso per minStrength: 0.5
        metadata: { confidence: 0.9, source: 'test' },
      },
    ];

    (require('./contextNavigateHandler').getContextLinks as jest.Mock).mockResolvedValue(mockLinks);

    await expect(
      findSemanticPath('ctx-1', 'ctx-4', {
        minStrength: 0.5,
        minConfidence: 0.7,
      })
    ).rejects.toThrow('Nessun percorso semantico trovato tra i contesti specificati');
  });

  it('dovrebbe fallire se uno dei contesti non esiste', async () => {
    await expect(findSemanticPath('ctx-non-esistente', 'ctx-1', {})).rejects.toThrow(
      'Contesto di partenza con ID ctx-non-esistente non trovato'
    );
  });
});

describe('findExploratoryPath', () => {
  const mockContexts = {
    'ctx-1': { id: 'ctx-1', text: 'Contesto 1', tags: ['architettura'] },
    'ctx-2': { id: 'ctx-2', text: 'Contesto 2', tags: ['performance'] },
    'ctx-3': { id: 'ctx-3', text: 'Contesto 3', tags: ['deprecato'] },
    'ctx-4': { id: 'ctx-4', text: 'Contesto 4', tags: ['architettura', 'performance'] },
  };

  // Definizione dell'interfaccia per i risultati degli archi (edge)
  interface EdgeResult {
    sourceId: string;
    targetId: string;
    relation: string;
    strength?: number;
    confidence?: number;
  }

  const mockLinks = [
    {
      id: 'link-1',
      sourceId: 'ctx-1',
      targetId: 'ctx-2',
      relation: 'supports',
      strength: 0.8,
      metadata: { confidence: 0.9 },
    },
    {
      id: 'link-2',
      sourceId: 'ctx-1',
      targetId: 'ctx-3',
      relation: 'explains',
      strength: 0.6,
      metadata: { confidence: 0.7 },
    },
    {
      id: 'link-3',
      sourceId: 'ctx-2',
      targetId: 'ctx-4',
      relation: 'extends',
      strength: 0.9,
      metadata: { confidence: 0.8 },
    },
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
      excludeTags: ['deprecato'],
    });

    expect(result.success).toBe(true);
    expect(result.path?.nodes).not.toContainEqual(expect.objectContaining({ id: 'ctx-3' }));
    expect(result.path?.nodes).toContainEqual(expect.objectContaining({ id: 'ctx-4' }));
  });

  it('dovrebbe generare un albero valido in formato tree', async () => {
    const result = await findExploratoryPath('ctx-1', {}, true, true, 'tree');

    expect(result.success).toBe(true);
    expect(
      result.path?.edges.every(
        (edge: EdgeResult) =>
          edge.sourceId === 'ctx-1' ||
          result.path?.edges.some((e: Pick<EdgeResult, 'targetId'>) => e.targetId === edge.sourceId)
      )
    ).toBe(true);
  });

  it('dovrebbe preferire le relazioni specificate', async () => {
    const result = await findExploratoryPath('ctx-1', {
      preferredRelations: ['supports'],
    });

    expect(result.success).toBe(true);
    expect(result.path?.edges[0].relation).toBe('supports');
  });

  it('dovrebbe gestire correttamente i contesti inesistenti', async () => {
    await expect(findExploratoryPath('ctx-999', {})).rejects.toThrow(
      'Contesto con ID ctx-999 non trovato'
    );
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
      minConfidence: 0.8,
    });

    expect(result.success).toBe(true);
    expect(
      result.path?.edges.every(
        (edge: EdgeResult) => edge.strength! >= 0.7 && edge.confidence! >= 0.8
      )
    ).toBe(true);
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
        metadata: { confidence: 0.8 },
      },
    ];

    (getContextLinks as jest.Mock).mockResolvedValueOnce(mockLinksWithBidirectional);

    const result = await findExploratoryPath('ctx-1', { maxSteps: 2 });

    expect(result.success).toBe(true);
    // Verifica che il link bidirezionale sia presente
    expect(result.path?.edges).toContainEqual(
      expect.objectContaining({
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
      })
    );
    expect(result.path?.edges).toContainEqual(
      expect.objectContaining({
        sourceId: 'ctx-2',
        targetId: 'ctx-1',
      })
    );
  });

  it('dovrebbe escludere relazioni penalizzate sotto soglia', async () => {
    const result = await findExploratoryPath('ctx-1', {
      excludeTags: ['deprecato'],
      minStrength: 0.7,
      minConfidence: 0.8,
    });

    expect(result.success).toBe(true);
    // Verifica che il link a ctx-3 (deprecato) sia escluso
    expect(result.path?.edges).not.toContainEqual(
      expect.objectContaining({
        targetId: 'ctx-3',
      })
    );
    // Verifica che il link a ctx-2 (non deprecato) sia incluso
    expect(result.path?.edges).toContainEqual(
      expect.objectContaining({
        targetId: 'ctx-2',
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
        metadata: { confidence: 0.9 },
      },
    ];

    (getContextLinks as jest.Mock).mockResolvedValueOnce(mockLinksWithCycle);

    const result = await findExploratoryPath('ctx-1', {}, true, true, 'graph');

    expect(result.success).toBe(true);
    // Verifica che i nodi non siano duplicati
    const nodeIds = result.path?.nodes.map((n) => n.id);
    expect(new Set(nodeIds).size).toBe(nodeIds?.length);
    // Verifica che il ciclo sia presente
    expect(result.path?.edges).toContainEqual(
      expect.objectContaining({
        sourceId: 'ctx-4',
        targetId: 'ctx-1',
      })
    );
  });
});
