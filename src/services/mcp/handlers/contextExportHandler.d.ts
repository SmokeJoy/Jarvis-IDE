import { ToolCallResult } from '../types/tool';
interface ExportOptions {
  format: 'json' | 'csv' | 'markdown';
  scope?: 'chat' | 'project' | 'agent';
  tags?: string[];
  sinceTimestamp?: number;
  includeMetadata?: boolean;
}
export declare function contextExportHandler(args: ExportOptions): Promise<ToolCallResult>;
export {};
//# sourceMappingURL=contextExportHandler.d.ts.map
