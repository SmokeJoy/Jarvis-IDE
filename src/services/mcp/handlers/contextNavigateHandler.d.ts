import { NavigationOptions } from '../utils/navigationGraph';
interface NavigationOptions {
  startId: string;
  targetId?: string;
  mode?: 'shortest' | 'semantic' | 'weighted' | 'exploratory';
  strategy?: {
    preferredRelations?: string[];
    minStrength?: number;
    minConfidence?: number;
    maxSteps?: number;
    requireTags?: string[];
    excludeTags?: string[];
  };
  includeContent?: boolean;
  includeMetadata?: boolean;
  format?: 'path' | 'tree' | 'graph';
}
interface NavigationResult {
  success: boolean;
  path?: {
    nodes: Array<{
      id: string;
      text?: string;
      tags?: string[];
    }>;
    edges: Array<{
      sourceId: string;
      targetId: string;
      relation: string;
      strength?: number;
      confidence?: number;
    }>;
  };
  error?: string;
}
export declare function contextNavigateHandler(
  startId: string,
  targetId: string | null,
  mode: 'shortest' | 'weighted' | 'semantic' | 'exploratory',
  options?: NavigationOptions,
  includeContent?: boolean,
  includeMetadata?: boolean,
  format?: 'tree' | 'graph'
): Promise<NavigationResult>;
export {};
//# sourceMappingURL=contextNavigateHandler.d.ts.map
