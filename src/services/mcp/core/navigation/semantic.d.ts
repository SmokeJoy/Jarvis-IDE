import type { NavigationOptions, NodeResult, EdgeResult } from '../../utils/navigationGraph.js';
export declare function findSemanticPath(startId: string, targetId: string, options?: NavigationOptions, includeContent?: boolean, includeMetadata?: boolean): Promise<{
    success: boolean;
    path?: {
        nodes: NodeResult[];
        edges: EdgeResult[];
    };
}>;
//# sourceMappingURL=semantic.d.ts.map