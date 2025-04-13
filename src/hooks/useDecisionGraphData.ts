import { useMemo } from 'react';
import { MitigatorOverlayProps } from '../components/MitigatorOverlay';

interface Node {
  id: string;
  type: 'provider' | 'strategy';
  data: {
    label: string;
    score?: number;
    status: 'selected' | 'excluded' | 'candidate';
    stats?: {
      latency: number;
      successRate: number;
    };
  };
  position: { x: number; y: number };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'default' | 'selected';
  animated?: boolean;
}

export function useDecisionGraphData(entry: MitigatorOverlayProps) {
  return useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Nodo strategia
    nodes.push({
      id: 'strategy',
      type: 'strategy',
      data: {
        label: entry.strategyName,
        status: 'selected',
      },
      position: { x: 0, y: 0 },
    });

    // Nodi provider
    entry.providerCandidates.forEach((provider, index) => {
      const isSelected = provider.id === entry.selectedProvider;
      const isExcluded = provider.excluded;

      nodes.push({
        id: provider.id,
        type: 'provider',
        data: {
          label: provider.id,
          score: provider.score,
          status: isSelected ? 'selected' : isExcluded ? 'excluded' : 'candidate',
          stats: provider.stats,
        },
        position: { x: 200, y: index * 100 },
      });

      // Edge dalla strategia al provider
      edges.push({
        id: `strategy-${provider.id}`,
        source: 'strategy',
        target: provider.id,
        type: isSelected ? 'selected' : 'default',
        animated: isSelected,
      });

      // Edge tra provider (se non è l'ultimo)
      if (index < entry.providerCandidates.length - 1) {
        edges.push({
          id: `${provider.id}-${entry.providerCandidates[index + 1].id}`,
          source: provider.id,
          target: entry.providerCandidates[index + 1].id,
          type: 'default',
        });
      }
    });

    return { nodes, edges };
  }, [entry]);
}
