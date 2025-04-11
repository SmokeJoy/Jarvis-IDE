import { ContextItem } from '../types/ContextItem.js';
interface EditOptions {
    id: string;
    text?: string;
    tags?: string[];
    scope?: 'chat' | 'project' | 'agent';
}
interface EditResult {
    id: string;
    original: ContextItem;
    updated: ContextItem;
    changes: {
        text?: boolean;
        tags?: boolean;
        scope?: boolean;
    };
}
export declare function editContext(options: EditOptions): Promise<EditResult | null>;
export declare function contextEditHandler(args: any): Promise<{
    success: boolean;
    output?: any;
    error?: string;
}>;
export {};
//# sourceMappingURL=contextEditHandler.d.ts.map