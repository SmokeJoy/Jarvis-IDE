export interface MemoryItem {
    id: string;
    content: string;
    timestamp: number;
    tags?: string[];
}
export interface Memory {
    items: MemoryItem[];
    lastUpdate: number;
}
export declare function loadMemoryFromDisk(): Memory;
export declare function saveMemoryToDisk(memory: Memory): void;
//# sourceMappingURL=memory.d.ts.map