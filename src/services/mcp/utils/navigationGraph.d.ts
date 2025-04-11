import type { ContextLink } from '../types.js';
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
export declare function calculateSemanticScore(link: ContextLink, options: NavigationOptions): number;
export declare function buildNodeResult(context: any, includeContent: boolean, includeMetadata: boolean): NodeResult;
export declare function buildEdgeResult(link: ContextLink, includeMetadata: boolean): EdgeResult;
export declare function filterLinksByOptions(links: ContextLink[], options: NavigationOptions): ContextLink[];
//# sourceMappingURL=navigationGraph.d.ts.map