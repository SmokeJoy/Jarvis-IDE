import { ContextLink } from '../types';
export function calculateSemanticScore(link, options) {
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
export function buildNodeResult(context, includeContent, includeMetadata) {
    const node = { id: context.id };
    if (includeContent) {
        node.text = context.text;
    }
    if (includeMetadata) {
        node.tags = context.tags;
    }
    return node;
}
export function buildEdgeResult(link, includeMetadata) {
    const edge = {
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
export function filterLinksByOptions(links, options) {
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
//# sourceMappingURL=navigationGraph.js.map