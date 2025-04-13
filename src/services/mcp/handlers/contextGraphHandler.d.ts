import { ContextItem } from '../../memory/context';
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
interface GraphOptions {
  rootId: string;
  depth?: number;
  direction?: 'incoming' | 'outgoing' | 'both';
  relation?: string;
  minStrength?: number;
  minConfidence?: number;
  includeRoot?: boolean;
  includeIsolated?: boolean;
}
interface GraphResult {
  nodes: ContextItem[];
  links: ContextLink[];
}
export declare function contextGraphHandler(args: GraphOptions): Promise<{
  success: boolean;
  output?: GraphResult;
  error?: string;
}>;
export {};
//# sourceMappingURL=contextGraphHandler.d.ts.map
