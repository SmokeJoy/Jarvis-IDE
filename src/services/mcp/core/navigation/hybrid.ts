import type { findSemanticPath } from './semantic.js';
import type { findExploratoryPath } from './exploratory.js';
import type { NavigationOptions } from '../types.js';
import type { ContextLink } from '../../../../memory/context_links.js';

interface HybridNavigationOptions extends NavigationOptions {
  semanticThreshold: number;  // Soglia per passare da exploratory a semantic
  maxExploratorySteps: number; // Passi massimi in modalità exploratory
  minSemanticScore: number;   // Punteggio minimo per considerare un percorso semanticamente valido
}

export async function findHybridPath(
  startId: string,
  targetId: string,
  options: HybridNavigationOptions,
  includeContent: boolean = true,
  includeMetadata: boolean = true
) {
  // 1. Prima prova con navigazione semantica
  try {
    const semanticResult = await findSemanticPath(
      startId,
      targetId,
      options,
      includeContent,
      includeMetadata
    );

    if (semanticResult.success && semanticResult.path) {
      // Calcola il punteggio semantico medio del percorso
      const avgScore = calculateAverageSemanticScore(semanticResult.path.edges, options);
      
      if (avgScore >= options.minSemanticScore) {
        return semanticResult; // Percorso semanticamente valido trovato
      }
    }
  } catch (error) {
    // Continua con exploratory se semantic fallisce
  }

  // 2. Se semantic fallisce o il punteggio è basso, usa exploratory
  const exploratoryResult = await findExploratoryPath(
    startId,
    {
      ...options,
      maxSteps: options.maxExploratorySteps
    },
    includeContent,
    includeMetadata,
    'graph' // Usa formato graph per mantenere tutti i possibili percorsi
  );

  if (!exploratoryResult.success || !exploratoryResult.path) {
    return exploratoryResult;
  }

  // 3. Filtra i percorsi esplorativi per punteggio semantico
  const filteredEdges = exploratoryResult.path.edges.filter(edge => {
    const score = calculateEdgeSemanticScore(edge, options);
    return score >= options.semanticThreshold;
  });

  // 4. Costruisci il risultato finale
  return {
    success: true,
    path: {
      nodes: exploratoryResult.path.nodes,
      edges: filteredEdges
    }
  };
}

function calculateAverageSemanticScore(edges: any[], options: HybridNavigationOptions): number {
  if (edges.length === 0) return 0;
  
  const totalScore = edges.reduce((sum, edge) => {
    return sum + calculateEdgeSemanticScore(edge, options);
  }, 0);

  return totalScore / edges.length;
}

function calculateEdgeSemanticScore(edge: ContextLink, options: HybridNavigationOptions): number {
  let score = (edge.strength || 0) * (edge.metadata?.confidence || 0);
  
  // Applica moltiplicatori per relazioni preferite
  if (options.preferredRelations?.includes(edge.relation)) {
    score *= 1.5;
  }

  // Applica pesi per tipo di fonte
  if (edge.metadata?.source === 'user') {
    score *= 1.2; // 20% di bonus per fonti umane
  } else if (edge.metadata?.source === 'tool') {
    score *= 0.8; // 20% di penalità per fonti automatiche
  }

  return score;
} 