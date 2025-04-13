import { NavigationOptions, NodeResult, EdgeResult } from '../../utils/navigationGraph';
export declare function findExploratoryPath(
  startId: string,
  options?: NavigationOptions,
  includeContent?: boolean,
  includeMetadata?: boolean,
  format?: 'tree' | 'graph'
): Promise<{
  success: boolean;
  path?: {
    nodes: NodeResult[];
    edges: EdgeResult[];
  };
}>;
//# sourceMappingURL=exploratory.d.ts.map
