/**
 * @deprecated Tutti i tipi sono stati spostati in 'src/services/mcp/mcp.types.ts'
 * Utilizzare direttamente `import { ... } from '../mcp.types.js'`
 */

import { NavigationParams } from './navigation.types';

// Re-export per retrocompatibilità temporanea
export * from '../mcp.types.js';

export interface ProjectSummaryArgs {
  depth?: number;
  includeFiles?: boolean;
}

export interface CodeGenerateArgs {
  prompt: string;
  language?: string;
}

export interface FsWriteArgs {
  path: string;
  content: string;
  encoding?: string;
}

export interface RefactorSnippetArgs {
  code: string;
  language: string;
  refactorType: string;
}

export interface AskDocsArgs {
  question: string;
  context?: string;
}

export interface ProjectLintArgs {
  path?: string;
  rules?: string[];
}

export interface FsFormatArgs {
  path: string;
  language?: string;
}

export interface TestRunArgs {
  path: string;
  testName?: string;
}

export interface ProjectDepGraphArgs {
  path?: string;
  includeDevDependencies?: boolean;
}

export interface ContextInjectArgs {
  content: string;
  tags?: string[];
}

export interface ContextListArgs {
  limit?: number;
  offset?: number;
}

export interface ContextClearArgs {
  confirm?: boolean;
}

export interface ContextTagArgs {
  id: string;
  tags: string[];
}

export interface ContextSearchByTagsArgs {
  tags: string[];
  limit?: number;
}

export interface ContextExportArgs {
  format: 'json' | 'csv' | 'markdown';
}

export interface ContextImportArgs {
  content: string;
  format: 'json' | 'csv' | 'markdown' | 'auto';
}

export interface ContextEditArgs {
  id: string;
  content: string;
}

export interface ContextLinkArgs {
  sourceId: string;
  targetId: string;
  relation: string;
}

export interface ContextLinksOfArgs {
  id: string;
  direction?: 'incoming' | 'outgoing';
}

export interface ContextGraphArgs {
  rootId: string;
  depth?: number;
}

export interface ContextUnlinkArgs {
  sourceId: string;
  targetId: string;
}

export interface ContextGraphExportArgs {
  rootId: string;
  format: 'dot' | 'mermaid' | 'graphml' | 'json-ld';
}

export interface NavigationOptions {
  preferredRelations?: string[];
  minStrength?: number;
  minConfidence?: number;
  maxSteps?: number;
  requireTags?: string[];
  excludeTags?: string[];
}

export interface ContextNavigateArgs extends NavigationParams {}