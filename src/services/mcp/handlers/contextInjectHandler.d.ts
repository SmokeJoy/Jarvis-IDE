import { McpToolHandler } from '../../../shared/types/mcp.types';
interface ContextItem {
  id: string;
  scope: string;
  text: string;
  timestamp: number;
  tags?: string[];
}
/**
 * Restituisce i contesti memorizzati per uno specifico scope
 */
export declare function getFromMemory(scope: string): ContextItem[];
/**
 * Restituisce tutti i contesti memorizzati
 */
export declare function getAllMemory(): Record<string, ContextItem[]>;
/**
 * Carica la memoria dal disco all'avvio
 */
export declare function loadMemoryFromDisk(): Promise<void>;
/**
 * Handler principale per context.inject
 */
export declare const contextInjectHandler: McpToolHandler;
export {};
//# sourceMappingURL=contextInjectHandler.d.ts.map
