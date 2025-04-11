import { ToolCallResult } from '../types/tool.js';
interface ImportOptions {
    format: 'auto' | 'json' | 'csv' | 'markdown';
    content: string;
    scope?: 'chat' | 'project' | 'agent';
    mergeTags?: boolean;
}
export declare function contextImportHandler(args: ImportOptions): Promise<ToolCallResult>;
export {};
//# sourceMappingURL=contextImportHandler.d.ts.map