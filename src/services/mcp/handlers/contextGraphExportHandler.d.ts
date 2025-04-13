interface GraphExportOptions {
  rootId: string;
  format?: 'dot' | 'mermaid' | 'graphml' | 'json-ld';
  depth?: number;
  direction?: 'incoming' | 'outgoing' | 'both';
  relation?: string;
  minStrength?: number;
  minConfidence?: number;
  includeRoot?: boolean;
  includeIsolated?: boolean;
  includeNodeText?: boolean;
  includeNodeTags?: boolean;
  includeEdgeMetadata?: boolean;
}
export declare function contextGraphExportHandler(args: GraphExportOptions): Promise<{
  success: boolean;
  output?: string;
  error?: string;
}>;
export {};
//# sourceMappingURL=contextGraphExportHandler.d.ts.map
