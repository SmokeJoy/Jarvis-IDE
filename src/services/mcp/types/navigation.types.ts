/**
 * 🛠️ Fix TypeScript – 2025-04-10
 * - Tipi consolidati per la navigazione
 * - Eliminazione duplicazioni
 */

/**
 * Opzioni per la navigazione tra contesti
 */
export interface NavigationOptions {
  preferredRelations?: string[];
  minStrength?: number;
  minConfidence?: number;
  maxSteps?: number;
  requireTags?: string[];
  excludeTags?: string[];
}

/**
 * Modalità di navigazione supportate
 */
export type NavigationMode = 'shortest' | 'weighted' | 'semantic' | 'exploratory';

/**
 * Formato di output per la navigazione
 */
export type NavigationFormat = 'tree' | 'graph';

/**
 * Risultato della navigazione
 */
export interface NavigationResult {
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

/**
 * Parametri per la navigazione
 */
export interface NavigationParams {
  startId: string;
  targetId?: string | null;
  mode?: NavigationMode;
  options?: NavigationOptions;
  includeContent?: boolean;
  includeProviderFields?: boolean;
  format?: NavigationFormat;
}
