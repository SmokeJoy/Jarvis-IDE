/**
 * 🛠️ Fix TypeScript – 2025-04-10
 * - Importazioni corrette
 * - Tipizzazione mock/test
 * - Eliminazione impliciti
 */

import { ContextLink } from '../types';
import { NavigationOptions, NavigationResult } from '../types/navigation.types';

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

export function calculateSemanticScore(link: ContextLink, options: NavigationOptions): number {
  let score = 1.0;

  // Moltiplicatori per relazioni preferite
  if (options.preferredRelations?.includes(link.relation)) {
    score *= 1.5;
  }

  // Moltiplicatori per strength e confidence
  if (link.strength) {
    score *= link.strength;
  }
  if (link.providerFields?.confidence) {
    score *= link.providerFields.confidence as number;
  }

  // Filtri su strength e confidence
  if (options.minStrength && link.strength && link.strength < options.minStrength) {
    score = 0;
  }
  if (
    options.minConfidence &&
    link.providerFields?.confidence &&
    (link.providerFields.confidence as number) < options.minConfidence
  ) {
    score = 0;
  }

  return score;
}

export function buildNodeResult(
  context: any,
  includeContent: boolean,
  includeProviderFields: boolean
): NodeResult {
  const node: NodeResult = { id: context.id };

  if (includeContent) {
    node.text = context.text;
  }
  if (includeContent) {
    node.tags = context.tags;
  }

  return node;
}

export function buildEdgeResult(link: ContextLink, includeProviderFields: boolean): EdgeResult {
  const edge: EdgeResult = {
    id: link.id,
    sourceId: link.sourceId,
    targetId: link.targetId,
    relation: link.relation,
  };

  if (includeProviderFields) {
    edge.strength = link.strength;
    edge.confidence = link.providerFields?.confidence as number | undefined;
  }

  return edge;
}

export function filterLinksByOptions(
  links: ContextLink[],
  options: NavigationOptions
): ContextLink[] {
  return links.filter((link) => {
    // Filtri su strength e confidence
    if (options.minStrength && link.strength && link.strength < options.minStrength) {
      return false;
    }
    if (
      options.minConfidence &&
      link.providerFields?.confidence &&
      (link.providerFields.confidence as number) < options.minConfidence
    ) {
      return false;
    }
    return true;
  });
}
