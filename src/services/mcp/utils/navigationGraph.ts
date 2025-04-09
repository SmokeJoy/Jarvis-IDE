import type { ContextLink } from '../types.js.js';

export interface NodeResult {
  id: string;
  text?: string;
  tags?: string[];
}

export interface EdgeResult {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  strength?: number;
  confidence?: number;
}

export interface NavigationOptions {
  maxSteps?: number;
  requireTags?: string[];
  excludeTags?: string[];
  preferredRelations?: string[];
  minStrength?: number;
  minConfidence?: number;
}

export function calculateSemanticScore(
  link: ContextLink,
  options: NavigationOptions
): number {
  let score = 1.0;

  // Moltiplicatori per relazioni preferite
  if (options.preferredRelations?.includes(link.relation)) {
    score *= 1.5;
  }

  // Moltiplicatori per strength e confidence
  if (link.strength) {
    score *= link.strength;
  }
  if (link.metadata?.confidence) {
    score *= link.metadata.confidence;
  }

  // Filtri su strength e confidence
  if (options.minStrength && link.strength && link.strength < options.minStrength) {
    score = 0;
  }
  if (options.minConfidence && link.metadata?.confidence && link.metadata.confidence < options.minConfidence) {
    score = 0;
  }

  return score;
}

export function buildNodeResult(
  context: any,
  includeContent: boolean,
  includeMetadata: boolean
): NodeResult {
  const node: NodeResult = { id: context.id };
  
  if (includeContent) {
    node.text = context.text;
  }
  if (includeMetadata) {
    node.tags = context.tags;
  }
  
  return node;
}

export function buildEdgeResult(
  link: ContextLink,
  includeMetadata: boolean
): EdgeResult {
  const edge: EdgeResult = {
    id: link.id,
    sourceId: link.sourceId,
    targetId: link.targetId,
    relation: link.relation
  };
  
  if (includeMetadata) {
    edge.strength = link.strength;
    edge.confidence = link.metadata?.confidence;
  }
  
  return edge;
}

export function filterLinksByOptions(
  links: ContextLink[],
  options: NavigationOptions
): ContextLink[] {
  return links.filter(link => {
    // Filtri su strength e confidence
    if (options.minStrength && link.strength && link.strength < options.minStrength) {
      return false;
    }
    if (options.minConfidence && link.metadata?.confidence && link.metadata.confidence < options.minConfidence) {
      return false;
    }
    return true;
  });
} 