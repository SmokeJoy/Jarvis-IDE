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
interface LinksOfOptions {
    id: string;
    direction?: "incoming" | "outgoing" | "both";
    relation?: string;
    minStrength?: number;
    minConfidence?: number;
}
interface LinksOfResult {
    incoming: ContextLink[];
    outgoing: ContextLink[];
}
export declare function contextLinksOfHandler(args: LinksOfOptions): Promise<{
    success: boolean;
    output?: LinksOfResult;
    error?: string;
}>;
export {};
//# sourceMappingURL=contextLinksOfHandler.d.ts.map