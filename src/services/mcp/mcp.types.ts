/**
 * @file mcp.types.ts
 * @description Definizioni di tipo centralizzate per gli handler MCP
 */

/**
 * Argomenti per la ricerca nella documentazione
 */
export interface SearchDocsArgs {
  /** Query di ricerca */
  query: string;
  /** Numero massimo di risultati da restituire (opzionale) */
  limit?: number;
}

/**
 * Argomenti per la lettura di un file
 */
export interface ReadFileArgs {
  /** Percorso del file da leggere */
  filePath: string;
  /** Encoding da utilizzare (opzionale, default: 'utf-8') */
  encoding?: string;
}

/**
 * Argomenti per la scansione di una directory
 */
export interface DirectoryScanArgs {
  /** Percorso della directory da scansionare */
  dirPath: string;
  /** Profondità massima di scansione (opzionale, default: 3) */
  maxDepth?: number;
  /** Directory da escludere (opzionale, default: ['.git', 'node_modules']) */
  excludeDirs?: string[];
}

/**
 * Argomenti per il linting di un file di configurazione
 */
export interface LintConfigArgs {
  /** Percorso del file di configurazione da validare */
  configPath: string;
  /** Tipo di configurazione (opzionale, auto-rilevato se non specificato) */
  configType?: 'json' | 'env' | 'yaml';
  /** Modalità strict (opzionale, default: false) */
  strict?: boolean;
}

/**
 * Argomenti per l'esecuzione di un comando terminale
 */
export interface RunTerminalCommandArgs {
  /** Comando da eseguire */
  command: string;
  /** Directory in cui eseguire il comando (opzionale) */
  cwd?: string;
  /** Timeout in millisecondi (opzionale) */
  timeout?: number;
}

/**
 * Argomenti per la ricerca nei file
 */
export interface SearchFilesArgs {
  /** Pattern o query di ricerca */
  query: string;
  /** Pattern delle directory da includere (opzionale) */
  include?: string[];
  /** Pattern delle directory da escludere (opzionale) */
  exclude?: string[];
  /** Numero massimo di risultati (opzionale) */
  maxResults?: number;
}

/**
 * Risposta generica con stato di successo e messaggio opzionale
 */
export interface BaseResponse {
  /** Indica se l'operazione è andata a buon fine */
  success: boolean;
  /** Messaggio opzionale (solitamente usato per errori) */
  message?: string;
}

/**
 * Risposta per la lettura di un file
 */
export interface ReadFileResponse extends BaseResponse {
  /** Contenuto del file letto (solo se success = true) */
  data?: string;
}

// Importazioni
import * as vscode from 'vscode';

// Interfaccia MockVscode per ambienti non-VS Code
export interface MockVscode {
  workspace: {
    workspaceFolders: null;
  };
}

/**
 * Argomenti per query alla memoria
 */
export interface MemoryQueryArgs {
  query: string;
  limit?: number;
}

/**
 * Argomenti per il riepilogo del progetto
 */
export interface ProjectSummaryArgs {
  depth?: number;
  includeFiles?: boolean;
}

/**
 * Argomenti per la generazione di codice
 */
export interface CodeGenerateArgs {
  prompt: string;
  language?: string;
}

/**
 * Argomenti per la scrittura su filesystem
 */
export interface FsWriteArgs {
  path: string;
  content: string;
  encoding?: string;
}

/**
 * Argomenti per il refactoring di codice
 */
export interface RefactorSnippetArgs {
  code: string;
  language: string;
  refactorType: string;
}

/**
 * Argomenti per domande sulla documentazione
 */
export interface AskDocsArgs {
  question: string;
  context?: string;
}

/**
 * Argomenti per l'analisi statica del codice
 */
export interface ProjectLintArgs {
  path?: string;
  rules?: string[];
}

/**
 * Argomenti per la formattazione dei file
 */
export interface FsFormatArgs {
  path: string;
  language?: string;
}

/**
 * Argomenti per l'esecuzione di test
 */
export interface TestRunArgs {
  path: string;
  testName?: string;
}

/**
 * Argomenti per la generazione del grafo delle dipendenze
 */
export interface ProjectDepGraphArgs {
  path?: string;
  includeDevDependencies?: boolean;
}

/**
 * Argomenti per l'iniezione di contesto
 */
export interface ContextInjectArgs {
  content: string;
  tags?: string[];
}

/**
 * Argomenti per la lista del contesto
 */
export interface ContextListArgs {
  limit?: number;
  offset?: number;
}

/**
 * Argomenti per la pulizia del contesto
 */
export interface ContextClearArgs {
  confirm?: boolean;
}

/**
 * Argomenti per l'applicazione di tag al contesto
 */
export interface ContextTagArgs {
  id: string;
  tags: string[];
}

/**
 * Argomenti per la ricerca di contesto per tag
 */
export interface ContextSearchByTagsArgs {
  tags: string[];
  limit?: number;
}

/**
 * Argomenti per l'esportazione del contesto
 */
export interface ContextExportArgs {
  format: 'json' | 'csv' | 'markdown';
}

/**
 * Argomenti per l'importazione del contesto
 */
export interface ContextImportArgs {
  content: string;
  format: 'json' | 'csv' | 'markdown' | 'auto';
}

/**
 * Argomenti per la modifica del contesto
 */
export interface ContextEditArgs {
  id: string;
  content: string;
}

/**
 * Argomenti per il collegamento del contesto
 */
export interface ContextLinkArgs {
  sourceId: string;
  targetId: string;
  relation: string;
}

/**
 * Argomenti per i collegamenti di contesto
 */
export interface ContextLinksOfArgs {
  id: string;
  direction?: 'incoming' | 'outgoing';
}

/**
 * Argomenti per il grafo del contesto
 */
export interface ContextGraphArgs {
  rootId: string;
  depth?: number;
}

/**
 * Argomenti per scollegare contesti
 */
export interface ContextUnlinkArgs {
  sourceId: string;
  targetId: string;
}

/**
 * Argomenti per l'esportazione del grafo del contesto
 */
export interface ContextGraphExportArgs {
  rootId: string;
  format: 'dot' | 'mermaid' | 'graphml' | 'json-ld';
}

/**
 * Argomenti per la navigazione del contesto
 */
export interface ContextNavigateArgs {
  startId: string;
  targetId: string;
  mode?: 'shortest' | 'weighted' | 'semantic' | 'exploratory';
  strategy?: {
    semanticThreshold?: number;
    maxExploratorySteps?: number;
    minSemanticScore?: number;
    preferredRelations?: string[];
    requireTags?: string[];
    excludeTags?: string[];
  };
}

// Costanti di configurazione
export const EXCLUDED_DIRS: string[] = ['node_modules', '.git', 'dist', 'build', '.vscode', 'out'];
export const KEY_FILE_EXTENSIONS: string[] = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];

// Rimosso re-export per evitare cicli di importazione
// export * from './types/handler.types';

/**
 * Argomenti per l'analisi di file di configurazione
 */
export interface LintConfigArgs {
  /** Percorso del file di configurazione da analizzare */
  configPath: string;
  /** Tipo di configurazione (opzionale, auto=determina dal file) */
  configType?: 'json' | 'yaml' | 'env' | 'auto';
  /** Modalità rigorosa per il linting (opzionale) */
  strict?: boolean;
}

/**
 * Argomenti per la scansione di directory
 */
export interface DirectoryScanArgs {
  /** Percorso della directory da scansionare */
  path: string;
  /** Profondità massima di scansione (opzionale) */
  maxDepth?: number;
  /** Esegue scansione ricorsiva (opzionale) */
  recursive?: boolean;
  /** Pattern di file/directory da escludere (opzionale) */
  exclude?: string[];
}
