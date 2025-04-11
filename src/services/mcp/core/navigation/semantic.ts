import type { getContextById } from '../../../memory/context.js';
import type { getContextLinks } from '../../../memory/context_links.js';
import type { ContextLink } from '../../types.js';
import type {
  NavigationOptions,
  NodeResult,
  EdgeResult,
  calculateSemanticScore,
  buildNodeResult,
  buildEdgeResult,
  filterLinksByOptions
} from '../../utils/navigationGraph.js';

interface DijkstraNode {
  id: string;
  distance: number;
  previous: string | null;
}

export async function findSemanticPath(
  startId: string,
  targetId: string,
  options: NavigationOptions = {},
  includeContent: boolean = false,
  includeMetadata: boolean = false
): Promise<{
  success: boolean;
  path?: {
    nodes: NodeResult[];
    edges: EdgeResult[];
  };
}> {
  // Verifica esistenza contesti
  const startContext = await getContextById(startId);
  const targetContext = await getContextById(targetId);
  
  if (!startContext) {
    throw new Error(`Contesto di partenza con ID ${startId} non trovato`);
  }
  if (!targetContext) {
    throw new Error(`Contesto di destinazione con ID ${targetId} non trovato`);
  }

  // Recupera e filtra i link
  const allLinks = await getContextLinks();
  const links = filterLinksByOptions(allLinks, options);

  // Costruisci il grafo
  const graph = new Map<string, Map<string, number>>();
  const nodes = new Set<string>();
  
  links.forEach(link => {
    if (!graph.has(link.sourceId)) {
      graph.set(link.sourceId, new Map());
    }
    if (!graph.has(link.targetId)) {
      graph.set(link.targetId, new Map());
    }
    
    const score = calculateSemanticScore(link, options);
    if (score > 0) {
      graph.get(link.sourceId)!.set(link.targetId, score);
      if (options.bidirectional) {
        graph.get(link.targetId)!.set(link.sourceId, score);
      }
    }
    
    nodes.add(link.sourceId);
    nodes.add(link.targetId);
  });

  // Dijkstra
  const distances = new Map<string, DijkstraNode>();
  const unvisited = new Set<string>();
  
  nodes.forEach(node => {
    distances.set(node, {
      id: node,
      distance: node === startId ? 0 : Infinity,
      previous: null
    });
    unvisited.add(node);
  });

  while (unvisited.size > 0) {
    // Trova il nodo con la distanza minima
    let current: DijkstraNode | null = null;
    for (const nodeId of unvisited) {
      const node = distances.get(nodeId)!;
      if (!current || node.distance < current.distance) {
        current = node;
      }
    }
    
    if (!current || current.distance === Infinity) {
      break;
    }
    
    unvisited.delete(current.id);
    
    // Se abbiamo raggiunto il target, possiamo fermarci
    if (current.id === targetId) {
      break;
    }
    
    // Aggiorna le distanze dei vicini
    const neighbors = graph.get(current.id) || new Map();
    for (const [neighborId, weight] of neighbors) {
      if (!unvisited.has(neighborId)) continue;
      
      const distance = current.distance + (1 / weight); // Invertiamo il peso per la distanza
      const neighbor = distances.get(neighborId)!;
      
      if (distance < neighbor.distance) {
        neighbor.distance = distance;
        neighbor.previous = current.id;
      }
    }
  }

  // Costruisci il percorso
  const path: string[] = [];
  let current = targetId;
  
  while (current && current !== startId) {
    path.unshift(current);
    const node = distances.get(current);
    if (!node || !node.previous) {
      return { success: false };
    }
    current = node.previous;
  }
  
  if (current !== startId) {
    return { success: false };
  }
  
  path.unshift(startId);

  // Costruisci il risultato
  const resultNodes: NodeResult[] = [];
  const resultEdges: EdgeResult[] = [];
  
  for (let i = 0; i < path.length; i++) {
    const nodeId = path[i];
    const context = await getContextById(nodeId);
    if (!context) continue;
    
    resultNodes.push(buildNodeResult(context, includeContent, includeMetadata));
    
    if (i < path.length - 1) {
      const nextId = path[i + 1];
      const link = links.find(l => 
        (l.sourceId === nodeId && l.targetId === nextId) ||
        (options.bidirectional && l.targetId === nodeId && l.sourceId === nextId)
      );
      
      if (link) {
        resultEdges.push(buildEdgeResult(link, includeMetadata));
      }
    }
  }

  return {
    success: true,
    path: {
      nodes: resultNodes,
      edges: resultEdges
    }
  };
} 