import type { findHybridPath } from './hybrid.js.js';
import type { getContextById } from '../../../../memory/context.js.js';
import type { getContextLinks } from '../../../../memory/context_links.js.js';

// Mock delle dipendenze
jest.mock('../../../../memory/context', () => ({
  getContextById: jest.fn()
}));

jest.mock('../../../../memory/context_links', () => ({
  getContextLinks: jest.fn()
}));

describe('findHybridPath', () => {
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
      metadata: { confidence: 0.9, source: 'user' }
    },
    {
      id: 'link-2',
      sourceId: 'ctx-1',
      targetId: 'ctx-3',
      relation: 'explains',
      strength: 0.6,
      metadata: { confidence: 0.7, source: 'tool' }
    },
    {
      id: 'link-3',
      sourceId: 'ctx-2',
      targetId: 'ctx-4',
      relation: 'extends',
      strength: 0.9,
      metadata: { confidence: 0.8, source: 'user' }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getContextById as jest.Mock).mockImplementation((id) => mockContexts[id]);
    (getContextLinks as jest.Mock).mockResolvedValue(mockLinks);
  });

  it('dovrebbe usare il percorso semantico se il punteggio è sufficiente', async () => {
    const result = await findHybridPath('ctx-1', 'ctx-4', {
      semanticThreshold: 0.5,
      maxExploratorySteps: 2,
      minSemanticScore: 0.6,
      preferredRelations: ['supports', 'extends']
    });

    expect(result.success).toBe(true);
    expect(result.path?.edges.length).toBeLessThanOrEqual(2); // Percorso diretto
  });

  it('dovrebbe usare exploratory se il punteggio semantico è basso', async () => {
    const result = await findHybridPath('ctx-1', 'ctx-4', {
      semanticThreshold: 0.5,
      maxExploratorySteps: 2,
      minSemanticScore: 0.9, // Punteggio molto alto per forzare exploratory
      preferredRelations: ['supports']
    });

    expect(result.success).toBe(true);
    expect(result.path?.edges.length).toBeGreaterThan(2); // Percorso esplorativo
  });

  it('dovrebbe filtrare i link per punteggio semantico', async () => {
    const result = await findHybridPath('ctx-1', 'ctx-4', {
      semanticThreshold: 0.7,
      maxExploratorySteps: 2,
      minSemanticScore: 0.9,
      preferredRelations: ['supports']
    });

    expect(result.success).toBe(true);
    // Verifica che i link filtrati abbiano punteggio >= 0.7
    result.path?.edges.forEach(edge => {
      const score = (edge.strength || 0) * (edge.confidence || 0);
      expect(score).toBeGreaterThanOrEqual(0.7);
    });
  });

  it('dovrebbe applicare pesi per tipo di fonte', async () => {
    const result = await findHybridPath('ctx-1', 'ctx-4', {
      semanticThreshold: 0.5,
      maxExploratorySteps: 2,
      minSemanticScore: 0.6,
      preferredRelations: ['supports']
    });

    expect(result.success).toBe(true);
    // Verifica che i link da fonti umane abbiano priorità
    const userLinks = result.path?.edges.filter(edge => 
      edge.metadata?.source === 'user'
    );
    expect(userLinks?.length).toBeGreaterThan(0);
  });

  it('dovrebbe gestire correttamente i contesti inesistenti', async () => {
    await expect(findHybridPath('ctx-999', 'ctx-4', {
      semanticThreshold: 0.5,
      maxExploratorySteps: 2,
      minSemanticScore: 0.6
    }))
      .rejects
      .toThrow('Contesto con ID ctx-999 non trovato');
  });

  it('dovrebbe includere content e metadata quando richiesto', async () => {
    const result = await findHybridPath('ctx-1', 'ctx-4', {
      semanticThreshold: 0.5,
      maxExploratorySteps: 2,
      minSemanticScore: 0.6
    }, true, true);

    expect(result.success).toBe(true);
    expect(result.path?.nodes[0]).toHaveProperty('text');
    expect(result.path?.edges[0]).toHaveProperty('strength');
    expect(result.path?.edges[0]).toHaveProperty('confidence');
  });
}); 