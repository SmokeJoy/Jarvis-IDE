import { findSemanticPath } from './semantic.js';
import { getContextById } from '../../../../memory/context.js';
import { getContextLinks } from '../../../../memory/context_links.js';

// Mock delle dipendenze
jest.mock('../../../../memory/context', () => ({
  getContextById: jest.fn()
}));

jest.mock('../../../../memory/context_links', () => ({
  getContextLinks: jest.fn()
}));

describe('findSemanticPath', () => {
  const mockContexts = {
    'ctx-1': { id: 'ctx-1', text: 'Contesto 1', tags: ['architettura'] },
    'ctx-2': { id: 'ctx-2', text: 'Contesto 2', tags: ['performance'] },
    'ctx-3': { id: 'ctx-3', text: 'Contesto 3', tags: ['deprecato'] }
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
      sourceId: 'ctx-2',
      targetId: 'ctx-3',
      relation: 'explains',
      strength: 0.6,
      metadata: { confidence: 0.7 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getContextById as jest.Mock).mockImplementation((id) => mockContexts[id]);
    (getContextLinks as jest.Mock).mockResolvedValue(mockLinks);
  });

  it('dovrebbe trovare il percorso ottimale tra due contesti', async () => {
    const result = await findSemanticPath('ctx-1', 'ctx-3');
    
    expect(result.success).toBe(true);
    expect(result.path?.nodes).toHaveLength(3);
    expect(result.path?.edges).toHaveLength(2);
    expect(result.path?.nodes[0].id).toBe('ctx-1');
    expect(result.path?.nodes[2].id).toBe('ctx-3');
  });

  it('dovrebbe gestire correttamente i contesti inesistenti', async () => {
    await expect(findSemanticPath('ctx-999', 'ctx-1'))
      .rejects
      .toThrow('Contesto di partenza con ID ctx-999 non trovato');
    
    await expect(findSemanticPath('ctx-1', 'ctx-999'))
      .rejects
      .toThrow('Contesto di destinazione con ID ctx-999 non trovato');
  });

  it('dovrebbe rispettare i filtri su strength e confidence', async () => {
    const result = await findSemanticPath('ctx-1', 'ctx-3', {
      minStrength: 0.7,
      minConfidence: 0.8
    });
    
    expect(result.success).toBe(true);
    expect(result.path?.edges.every(edge => 
      edge.strength! >= 0.7 && edge.confidence! >= 0.8
    )).toBe(true);
  });

  it('dovrebbe preferire le relazioni specificate', async () => {
    const result = await findSemanticPath('ctx-1', 'ctx-3', {
      preferredRelations: ['supports']
    });
    
    expect(result.success).toBe(true);
    expect(result.path?.edges[0].relation).toBe('supports');
  });

  it('dovrebbe includere content e metadata quando richiesto', async () => {
    const result = await findSemanticPath('ctx-1', 'ctx-3', {}, true, true);
    
    expect(result.success).toBe(true);
    expect(result.path?.nodes[0]).toHaveProperty('text');
    expect(result.path?.nodes[0]).toHaveProperty('tags');
    expect(result.path?.edges[0]).toHaveProperty('strength');
    expect(result.path?.edges[0]).toHaveProperty('confidence');
  });

  it('dovrebbe gestire correttamente i link bidirezionali', async () => {
    const mockLinksWithBidirectional = [
      ...mockLinks,
      {
        id: 'link-3',
        sourceId: 'ctx-3',
        targetId: 'ctx-1',
        relation: 'extends',
        strength: 0.9,
        metadata: { confidence: 0.8 }
      }
    ];

    (getContextLinks as jest.Mock).mockResolvedValueOnce(mockLinksWithBidirectional);

    const result = await findSemanticPath('ctx-1', 'ctx-3', { bidirectional: true });
    
    expect(result.success).toBe(true);
    expect(result.path?.edges).toContainEqual(
      expect.objectContaining({
        sourceId: 'ctx-3',
        targetId: 'ctx-1'
      })
    );
  });

  it('dovrebbe restituire success: false se non esiste un percorso', async () => {
    const mockLinksDisconnected = [
      {
        id: 'link-1',
        sourceId: 'ctx-1',
        targetId: 'ctx-2',
        relation: 'supports',
        strength: 0.8,
        metadata: { confidence: 0.9 }
      }
    ];

    (getContextLinks as jest.Mock).mockResolvedValueOnce(mockLinksDisconnected);

    const result = await findSemanticPath('ctx-1', 'ctx-3');
    
    expect(result.success).toBe(false);
    expect(result.path).toBeUndefined();
  });

  it('dovrebbe generare uno snapshot stabile per il percorso semantico', async () => {
    const result = await findSemanticPath('ctx-1', 'ctx-3');
    
    expect(result).toMatchSnapshot();
  });
}); 