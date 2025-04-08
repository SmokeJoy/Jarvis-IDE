import { ContextItem, getMemoryContexts } from "../../memory/context.js";
import { readFile } from "fs/promises";
import path from "path";
import { findSemanticPath } from '../core/navigation/semantic.js';
import { findExploratoryPath } from '../core/navigation/exploratory.js';
import type { NavigationOptions } from '../utils/navigationGraph.js';

interface ContextLink {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  bidirectional: boolean;
  strength: number;
  metadata: {
    confidence: number;
    source: string;
    timestamp: string;
  };
}

interface NavigationOptions {
  startId: string;
  targetId?: string;
  mode?: "shortest" | "semantic" | "weighted" | "exploratory";
  strategy?: {
    preferredRelations?: string[];
    minStrength?: number;
    minConfidence?: number;
    maxSteps?: number;
    requireTags?: string[];
    excludeTags?: string[];
  };
  includeContent?: boolean;
  includeMetadata?: boolean;
  format?: "path" | "tree" | "graph";
}

interface NavigationResult {
  success: boolean;
  path?: {
    nodes: Array<{
      id: string;
      text?: string;
      tags?: string[];
    }>;
    edges: Array<{
      sourceId: string;
      targetId: string;
      relation: string;
      strength?: number;
      confidence?: number;
    }>;
  };
  error?: string;
}

async function getContextLinks(): Promise<ContextLink[]> {
  try {
    const linksPath = path.join(__dirname, "../../data/context_links.json");
    const data = await readFile(linksPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function buildGraph(links: ContextLink[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const link of links) {
    // Aggiungi arco da source a target
    if (!graph.has(link.sourceId)) {
      graph.set(link.sourceId, new Set());
    }
    graph.get(link.sourceId)!.add(link.targetId);

    // Se bidirezionale, aggiungi anche l'arco inverso
    if (link.bidirectional) {
      if (!graph.has(link.targetId)) {
        graph.set(link.targetId, new Set());
      }
      graph.get(link.targetId)!.add(link.sourceId);
    }
  }

  return graph;
}

function findShortestPath(
  graph: Map<string, Set<string>>,
  startId: string,
  targetId: string
): string[] | null {
  const visited = new Set<string>();
  const queue: Array<{ node: string; path: string[] }> = [
    { node: startId, path: [startId] },
  ];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (node === targetId) {
      return path;
    }

    if (visited.has(node)) {
      continue;
    }

    visited.add(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return null;
}

/**
 * Trova il percorso ottimale tra due contesti usando l'algoritmo di Dijkstra
 * con pesi basati su strength e confidence delle relazioni
 */
async function findWeightedPath(
    startId: string,
    targetId: string,
    links: ContextLink[],
    contexts: ContextItem[],
    strategy?: NavigationStrategy,
    includeContent: boolean = true,
    includeMetadata: boolean = true
): Promise<NavigationResult> {
    // Costruisci il grafo
    const graph = buildGraph(links);
    
    // Inizializza le strutture per Dijkstra
    const distances: Record<string, number> = {};
    const previous: Record<string, string> = {};
    const visited: Set<string> = new Set();
    const queue: string[] = [];
    
    // Inizializza le distanze
    for (const nodeId of Object.keys(graph)) {
        distances[nodeId] = nodeId === startId ? 0 : Infinity;
        queue.push(nodeId);
    }
    
    // Funzione per calcolare il peso di una relazione
    const calculateWeight = (link: ContextLink): number => {
        let weight = 1;
        
        // Peso base inverso (1 - strength * confidence)
        const strength = link.strength || 1;
        const confidence = link.metadata?.confidence || 1;
        weight = 1 - (strength * confidence);
        
        // Penalità per relazioni non preferite
        if (strategy?.preferredRelations && 
            !strategy.preferredRelations.includes(link.relation)) {
            weight *= 1.5; // Aumenta il peso del 50%
        }
        
        return weight;
    };
    
    // Algoritmo di Dijkstra
    while (queue.length > 0) {
        // Trova il nodo con la distanza minima
        queue.sort((a, b) => distances[a] - distances[b]);
        const current = queue.shift()!;
        
        if (current === targetId) break;
        if (distances[current] === Infinity) break;
        
        visited.add(current);
        
        // Esplora i vicini
        for (const edge of graph[current]) {
            if (visited.has(edge.targetId)) continue;
            
            // Filtra per forza e confidenza minima
            if (strategy?.minStrength && (edge.strength || 0) < strategy.minStrength) continue;
            if (strategy?.minConfidence && (edge.metadata?.confidence || 0) < strategy.minConfidence) continue;
            
            const weight = calculateWeight(edge);
            const distance = distances[current] + weight;
            
            if (distance < distances[edge.targetId]) {
                distances[edge.targetId] = distance;
                previous[edge.targetId] = current;
            }
        }
    }
    
    // Costruisci il percorso
    const path: string[] = [];
    let current = targetId;
    
    while (current && current !== startId) {
        path.unshift(current);
        current = previous[current];
    }
    
    if (current !== startId) {
        throw new Error("Nessun percorso trovato tra i contesti specificati");
    }
    
    path.unshift(startId);
    
    // Costruisci il risultato
    const nodes = path.map(id => {
        const context = contexts.find(c => c.id === id);
        if (!context) throw new Error(`Contesto con ID ${id} non trovato`);
        
        return {
            id: context.id,
            ...(includeContent && { text: context.text }),
            ...(includeContent && { tags: context.tags })
        };
    });
    
    const edges = path.slice(1).map((targetId, i) => {
        const sourceId = path[i];
        const link = links.find(l => 
            (l.sourceId === sourceId && l.targetId === targetId) ||
            (l.targetId === sourceId && l.sourceId === targetId && l.bidirectional)
        );
        
        if (!link) throw new Error(`Relazione non trovata tra ${sourceId} e ${targetId}`);
        
        return {
            sourceId,
            targetId,
            relation: link.relation,
            ...(includeMetadata && { strength: link.strength }),
            ...(includeMetadata && { confidence: link.metadata?.confidence })
        };
    });
    
    return {
        nodes,
        edges
    };
}

async function navigateShortest(
  options: NavigationOptions,
  contexts: ContextItem[],
  links: ContextLink[]
): Promise<NavigationResult> {
  if (!options.targetId) {
    return {
      success: false,
      error: "La modalità 'shortest' richiede un targetId",
    };
  }

  // Verifica che i contesti esistano
  const startContext = contexts.find((ctx) => ctx.id === options.startId);
  const targetContext = contexts.find((ctx) => ctx.id === options.targetId);

  if (!startContext) {
    return {
      success: false,
      error: `Contesto di partenza con ID ${options.startId} non trovato`,
    };
  }

  if (!targetContext) {
    return {
      success: false,
      error: `Contesto di destinazione con ID ${options.targetId} non trovato`,
    };
  }

  // Costruisci il grafo
  const graph = buildGraph(links);

  // Trova il percorso più breve
  const path = findShortestPath(graph, options.startId, options.targetId);

  if (!path) {
    return {
      success: false,
      error: "Nessun percorso trovato tra i contesti specificati",
    };
  }

  // Costruisci il risultato
  const result: NavigationResult = {
    success: true,
    path: {
      nodes: [],
      edges: [],
    },
  };

  // Aggiungi i nodi
  for (const nodeId of path) {
    const context = contexts.find((ctx) => ctx.id === nodeId)!;
    const node: any = { id: nodeId };
    
    if (options.includeContent) {
      node.text = context.text;
    }
    if (options.includeMetadata) {
      node.tags = context.tags;
    }
    
    result.path!.nodes.push(node);
  }

  // Aggiungi gli archi
  for (let i = 0; i < path.length - 1; i++) {
    const sourceId = path[i];
    const targetId = path[i + 1];
    
    const link = links.find(
      (l) =>
        (l.sourceId === sourceId && l.targetId === targetId) ||
        (l.bidirectional && l.sourceId === targetId && l.targetId === sourceId)
    )!;

    const edge: any = {
      sourceId,
      targetId,
      relation: link.relation,
    };

    if (options.includeMetadata) {
      edge.strength = link.strength;
      edge.confidence = link.metadata.confidence;
    }

    result.path!.edges.push(edge);
  }

  return result;
}

/**
 * Trova il percorso semanticamente più rilevante tra due contesti
 */
async function findSemanticPath(
  startId: string,
  targetId: string,
  strategy: NavigationStrategy,
  includeContent: boolean = true,
  includeMetadata: boolean = true
): Promise<NavigationResult> {
  // Cache per i contesti
  const contextCache = new Map<string, any>();

  // Funzione helper per ottenere contesti con caching
  async function getCachedContext(id: string): Promise<any> {
    if (!contextCache.has(id)) {
      const ctx = await getContextById(id);
      if (!ctx) {
        throw new Error(`Contesto con ID ${id} non trovato`);
      }
      contextCache.set(id, ctx);
    }
    return contextCache.get(id)!;
  }

  // Verifica esistenza contesti
  const startContext = await getCachedContext(startId);
  const targetContext = await getCachedContext(targetId);

  // Recupera tutti i link
  const links = await getContextLinks();
  
  // Costruisci grafo pesato semanticamente
  const graph = new Map<string, Array<{ target: string; link: ContextLink; score: number }>>();
  
  // Inizializza Dijkstra
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; distance: number }> = [];
  
  // Inizializza strutture
  distances.set(startId, 0);
  queue.push({ id: startId, distance: 0 });
  
  // Funzione per calcolare il peso semantico di un link
  const calculateSemanticScore = (link: ContextLink, context: any): number => {
    let score = 1; // Base
    
    // Punteggio per tag
    if (strategy.requireTags?.length) {
      const hasAllRequiredTags = strategy.requireTags.every(tag => context.tags?.includes(tag));
      if (hasAllRequiredTags) score += 1;
    }
    
    if (strategy.excludeTags?.length) {
      const hasExcludedTags = strategy.excludeTags.some(tag => context.tags?.includes(tag));
      if (hasExcludedTags) score -= 1;
    }
    
    // Bonus per relazioni preferite
    if (strategy.preferredRelations?.includes(link.relation)) {
      score += 0.5;
    }
    
    // Moltiplicatore per forza e confidenza
    const strength = link.strength || 1;
    const confidence = link.metadata?.confidence || 1;
    score *= (strength * confidence);
    
    return score;
  };
  
  // Costruisci grafo
  for (const link of links) {
    if (!graph.has(link.sourceId)) {
      graph.set(link.sourceId, []);
    }
    
    const sourceContext = await getCachedContext(link.sourceId);
    const score = calculateSemanticScore(link, sourceContext);
    
    // Applica filtri
    if (strategy.minStrength && (link.strength || 0) < strategy.minStrength) continue;
    if (strategy.minConfidence && (link.metadata?.confidence || 0) < strategy.minConfidence) continue;
    
    graph.get(link.sourceId)!.push({
      target: link.targetId,
      link,
      score
    });
    
    // Aggiungi anche il link inverso se bidirezionale
    if (link.bidirectional) {
      if (!graph.has(link.targetId)) {
        graph.set(link.targetId, []);
      }
      graph.get(link.targetId)!.push({
        target: link.sourceId,
        link,
        score
      });
    }
  }
  
  // Dijkstra modificato
  while (queue.length > 0) {
    // Ordina per distanza crescente
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift()!;
    
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    
    if (current.id === targetId) break;
    
    const neighbors = graph.get(current.id) || [];
    for (const neighbor of neighbors) {
      const newDistance = current.distance + (1 / neighbor.score); // Inverti il punteggio per minimizzare
      
      if (!distances.has(neighbor.target) || newDistance < distances.get(neighbor.target)!) {
        distances.set(neighbor.target, newDistance);
        previous.set(neighbor.target, current.id);
        queue.push({ id: neighbor.target, distance: newDistance });
      }
    }
  }
  
  // Costruisci il percorso
  const path: string[] = [];
  let current = targetId;
  
  while (current && current !== startId) {
    path.unshift(current);
    current = previous.get(current) || '';
  }
  
  if (current !== startId) {
    throw new Error('Nessun percorso semantico trovato tra i contesti specificati');
  }
  
  path.unshift(startId);
  
  // Costruisci il risultato
  const nodes = [];
  const edges = [];
  
  for (let i = 0; i < path.length; i++) {
    const context = await getCachedContext(path[i]);
    
    nodes.push({
      id: context.id,
      ...(includeContent && { text: context.text }),
      ...(includeContent && { tags: context.tags })
    });
    
    if (i < path.length - 1) {
      const link = links.find(l => 
        (l.sourceId === path[i] && l.targetId === path[i + 1]) ||
        (l.targetId === path[i] && l.sourceId === path[i + 1] && l.bidirectional)
      );
      
      if (link) {
        edges.push({
          sourceId: link.sourceId,
          targetId: link.targetId,
          relation: link.relation,
          ...(includeMetadata && { strength: link.strength }),
          ...(includeMetadata && { confidence: link.metadata?.confidence })
        });
      }
    }
  }
  
  return {
    success: true,
    path: {
      nodes,
      edges
    }
  };
}

/**
 * Trova un percorso esplorativo a partire da un contesto
 */
async function findExploratoryPath(
  startId: string,
  strategy: NavigationStrategy,
  includeContent: boolean = true,
  includeMetadata: boolean = true,
  format: "tree" | "graph" = "graph"
): Promise<NavigationResult> {
  // Cache per i contesti
  const contextCache = new Map<string, any>();

  // Funzione helper per ottenere contesti con caching
  async function getCachedContext(id: string): Promise<any> {
    if (!contextCache.has(id)) {
      const ctx = await getContextById(id);
      if (!ctx) {
        throw new Error(`Contesto con ID ${id} non trovato`);
      }
      contextCache.set(id, ctx);
    }
    return contextCache.get(id)!;
  }

  // Verifica esistenza contesto iniziale
  const startContext = await getCachedContext(startId);

  // Recupera tutti i link
  const links = await getContextLinks();
  
  // Strutture per BFS
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number; parentId?: string }> = [];
  const nodes = new Map<string, any>();
  const edges: Array<{ sourceId: string; targetId: string; relation: string; strength?: number; confidence?: number }> = [];
  const parentMap = new Map<string, string>(); // child -> parent
  
  // Inizializza BFS
  queue.push({ id: startId, depth: 0 });
  visited.add(startId);
  
  // Funzione per calcolare il peso semantico di un link
  const calculateSemanticScore = (link: ContextLink, context: any): number => {
    let score = 1; // Base
    
    // Punteggio per tag
    if (strategy.requireTags?.length) {
      const hasAllRequiredTags = strategy.requireTags.every(tag => context.tags?.includes(tag));
      if (hasAllRequiredTags) score += 1;
    }
    
    if (strategy.excludeTags?.length) {
      const hasExcludedTags = strategy.excludeTags.some(tag => context.tags?.includes(tag));
      if (hasExcludedTags) score -= 1;
    }
    
    // Bonus per relazioni preferite
    if (strategy.preferredRelations?.includes(link.relation)) {
      score += 0.5;
    }
    
    // Moltiplicatore per forza e confidenza
    const strength = link.strength || 1;
    const confidence = link.metadata?.confidence || 1;
    score *= (strength * confidence);
    
    return score;
  };
  
  // BFS con punteggio semantico
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Raggiunto limite di profondità
    if (strategy.maxSteps && current.depth >= strategy.maxSteps) {
      continue;
    }
    
    // Recupera contesto corrente
    const context = await getCachedContext(current.id);
    
    // Aggiungi nodo al risultato
    nodes.set(current.id, {
      id: current.id,
      ...(includeContent && { text: context.text }),
      ...(includeContent && { tags: context.tags })
    });
    
    // Trova link uscenti
    const outgoingLinks = links.filter(link => 
      link.sourceId === current.id || 
      (link.targetId === current.id && link.bidirectional)
    );
    
    // Ordina link per punteggio semantico
    const scoredLinks = await Promise.all(
      outgoingLinks.map(async link => {
        const targetId = link.sourceId === current.id ? link.targetId : link.sourceId;
        const targetContext = await getCachedContext(targetId);
        const score = calculateSemanticScore(link, targetContext);
        return { link, score, targetId };
      })
    );
    
    // Filtra e ordina per punteggio
    const validLinks = scoredLinks
      .filter(({ link, score }) => {
        if (strategy.minStrength && (link.strength || 0) < strategy.minStrength) return false;
        if (strategy.minConfidence && (link.metadata?.confidence || 0) < strategy.minConfidence) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
    
    // Espandi i nodi migliori
    for (const { link, targetId } of validLinks) {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        queue.push({ 
          id: targetId, 
          depth: current.depth + 1,
          parentId: current.id
        });
        
        // Memorizza relazione padre-figlio
        parentMap.set(targetId, current.id);
        
        // Aggiungi arco al risultato
        edges.push({
          sourceId: link.sourceId,
          targetId: link.targetId,
          relation: link.relation,
          ...(includeMetadata && { strength: link.strength }),
          ...(includeMetadata && { confidence: link.metadata?.confidence })
        });
      }
    }
  }
  
  // Costruisci risultato in formato tree o graph
  if (format === "tree") {
    // Per tree, manteniamo solo gli archi che formano l'albero di esplorazione
    const treeEdges = edges.filter(edge => 
      parentMap.get(edge.targetId) === edge.sourceId || 
      parentMap.get(edge.sourceId) === edge.targetId
    );
    
    return {
      success: true,
      path: {
        nodes: Array.from(nodes.values()),
        edges: treeEdges
      }
    };
  } else {
    // Per graph, manteniamo tutti gli archi validi
    return {
      success: true,
      path: {
        nodes: Array.from(nodes.values()),
        edges
      }
    };
  }
}

export async function contextNavigateHandler(
  startId: string,
  targetId: string | null,
  mode: 'shortest' | 'weighted' | 'semantic' | 'exploratory',
  options: NavigationOptions = {},
  includeContent: boolean = false,
  includeMetadata: boolean = false,
  format: 'tree' | 'graph' = 'graph'
) {
  switch (mode) {
    case 'shortest':
    case 'weighted':
    case 'semantic':
      if (!targetId) {
        throw new Error('ID del contesto di destinazione mancante');
      }
      return findSemanticPath(startId, targetId, options, includeContent, includeMetadata);
    
    case 'exploratory':
      return findExploratoryPath(startId, options, includeContent, includeMetadata, format);
    
    default:
      throw new Error(`Modalità di navigazione non supportata: ${mode}`);
  }
} 