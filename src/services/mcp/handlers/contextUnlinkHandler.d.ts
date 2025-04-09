interface UnlinkOptions {
    sourceId: string;
    targetId: string;
    relation?: string;
    bidirectional?: boolean;
}
export declare function contextUnlinkHandler(args: UnlinkOptions): Promise<{
    success: boolean;
    output?: {
        removed: number;
    };
    error?: string;
}>;
export {};
//# sourceMappingURL=contextUnlinkHandler.d.ts.map