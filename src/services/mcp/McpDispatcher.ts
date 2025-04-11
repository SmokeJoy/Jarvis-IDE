/**
 * 🛠️ Fix TypeScript – 2025-04-10
 * - Importazioni corrette
 * - Tipizzazione mock/test
 * - Eliminazione impliciti
 */

import { WebviewMessage, McpToolCall, ToolResponse } from '../../shared/types/messages';
import { isErrorMessage, isResponseMessage, safeCastAs } from '../../shared/types/webviewMessageUnion';
import { readFileHandler } from './handlers/readFileHandler.js';
import { searchDocsHandler } from './handlers/searchDocsHandler.js';
import { memoryQueryHandler } from './handlers/memoryQueryHandler.js';
import { projectSummaryHandler } from './handlers/projectSummaryHandler.js';
import { codeGenerateHandler } from './handlers/codeGenerateHandler.js';
import { fsWriteHandler } from './handlers/fsWriteHandler.js';
import { refactorSnippetHandler } from './handlers/refactorSnippetHandler.js';
import { askDocsHandler } from './handlers/askDocsHandler.js';
import { projectLintHandler } from './handlers/projectLintHandler.js';
import { fsFormatHandler } from './handlers/fsFormatHandler.js';
import { testRunHandler } from './handlers/testRunHandler.js';
import { projectDepGraphHandler } from './handlers/projectDepGraphHandler.js';
import { contextInjectHandler } from './handlers/contextInjectHandler.js';
import { contextListHandler } from './handlers/contextListHandler.js';
import { contextClearHandler } from './handlers/contextClearHandler.js';
import { contextTagHandler } from './handlers/contextTagHandler.js';
import { contextSearchByTagsHandler } from './handlers/contextSearchByTagsHandler.js';
import { contextExportHandler } from './handlers/contextExportHandler.js';
import { contextImportHandler } from './handlers/contextImportHandler.js';
import { contextEditHandler } from './handlers/contextEditHandler.js';
import { contextLinkHandler } from './handlers/contextLinkHandler.js';
import { contextLinksOfHandler } from './handlers/contextLinksOfHandler.js';
import { contextGraphHandler } from './handlers/contextGraphHandler.js';
import { contextUnlinkHandler } from './handlers/contextUnlinkHandler.js';
import { contextGraphExportHandler } from './handlers/contextGraphExportHandler.js';
import { contextNavigateHandler } from './handlers/contextNavigateHandler.js';
import { loadMemoryFromDisk } from './memory/memory.js';
import { Memory } from './memory/memory.js';
import {
  ReadFileArgs,
  SearchDocsArgs,
  MemoryQueryArgs,
  ProjectSummaryArgs,
  CodeGenerateArgs,
  FsWriteArgs,
  RefactorSnippetArgs,
  AskDocsArgs,
  ProjectLintArgs,
  FsFormatArgs,
  TestRunArgs,
  ProjectDepGraphArgs,
  ContextInjectArgs,
  ContextListArgs,
  ContextClearArgs,
  ContextTagArgs,
  ContextSearchByTagsArgs,
  ContextExportArgs,
  ContextImportArgs,
  ContextEditArgs,
  ContextLinkArgs,
  ContextLinksOfArgs,
  ContextGraphArgs,
  ContextUnlinkArgs,
  ContextGraphExportArgs,
  ContextNavigateArgs
} from './types/handler.types.js';
import { NavigationOptions } from './types/navigation.types';

type HandlerFunction<T = Record<string, unknown>, R = unknown> = (args: T) => Promise<R>;

interface HandlerMap {
    'read_file': typeof readFileHandler;
    'search_docs': typeof searchDocsHandler;
    'memory.query': typeof memoryQueryHandler;
    'project.summary': typeof projectSummaryHandler;
    'code.generate': typeof codeGenerateHandler;
    'fs.write': typeof fsWriteHandler;
    'refactor.snippet': typeof refactorSnippetHandler;
    'ask.docs': typeof askDocsHandler;
    'project.lint': typeof projectLintHandler;
    'fs.format': typeof fsFormatHandler;
    'test.run': typeof testRunHandler;
    'project.depGraph': typeof projectDepGraphHandler;
    'context.inject': typeof contextInjectHandler;
    'context.list': typeof contextListHandler;
    'context.clear': typeof contextClearHandler;
    'context.tag': typeof contextTagHandler;
    'context.searchByTags': typeof contextSearchByTagsHandler;
    'context.export': typeof contextExportHandler;
    'context.import': typeof contextImportHandler;
    'context.edit': typeof contextEditHandler;
    'context.link': typeof contextLinkHandler;
    'context.linksOf': typeof contextLinksOfHandler;
    'context.graph': typeof contextGraphHandler;
    'context.unlink': typeof contextUnlinkHandler;
    'context.graphExport': typeof contextGraphExportHandler;
    'context.navigate': typeof contextNavigateHandler;
}

/**
 * Dispatcher per il Model Control Protocol (MCP)
 * Gestisce le chiamate strumentali dei modelli
 */
export class McpDispatcher {
    private memory: Memory;
    private readonly handlers: HandlerMap = {
        'read_file': readFileHandler,
        'search_docs': searchDocsHandler,
        'memory.query': memoryQueryHandler,
        'project.summary': projectSummaryHandler,
        'code.generate': codeGenerateHandler,
        'fs.write': fsWriteHandler,
        'refactor.snippet': refactorSnippetHandler,
        'ask.docs': askDocsHandler,
        'project.lint': projectLintHandler,
        'fs.format': fsFormatHandler,
        'test.run': testRunHandler,
        'project.depGraph': projectDepGraphHandler,
        'context.inject': contextInjectHandler,
        'context.list': contextListHandler,
        'context.clear': contextClearHandler,
        'context.tag': contextTagHandler,
        'context.searchByTags': contextSearchByTagsHandler,
        'context.export': contextExportHandler,
        'context.import': contextImportHandler,
        'context.edit': contextEditHandler,
        'context.link': contextLinkHandler,
        'context.linksOf': contextLinksOfHandler,
        'context.graph': contextGraphHandler,
        'context.unlink': contextUnlinkHandler,
        'context.graphExport': contextGraphExportHandler,
        'context.navigate': contextNavigateHandler
    };

    constructor(private readonly callback: (message: WebviewMessage) => void) {
        this.memory = loadMemoryFromDisk();
    }

    /**
     * Gestisce una chiamata strumentale
     * @param call Chiamata strumentale
     */
    async handleToolCall(call: McpToolCall): Promise<ToolResponse> {
        console.log(`McpDispatcher: Gestione chiamata strumentale ${call.tool}`);

        try {
            const handler = this.handlers[call.tool as keyof HandlerMap];
            if (!handler) {
                throw new Error(`Unknown tool: ${call.tool}`);
            }

            let result: unknown;
            if (call.tool === 'context.graphExport') {
                result = await handler({
                    ...call.args as ContextGraphExportArgs,
                    format: 'dot'
                });
            } else if (call.tool === 'context.navigate') {
                const args = call.args as ContextNavigateArgs;
                const options: NavigationOptions = {
                    ...args.options,
                    minStrength: args.options?.minStrength ?? 0.5,
                    minConfidence: args.options?.minConfidence ?? 0.7
                };
                
                result = await handler(
                    args.startId,
                    args.targetId ?? null,
                    args.mode ?? 'semantic',
                    options,
                    args.includeContent ?? false,
                    args.includeMetadata ?? false,
                    args.format ?? 'graph'
                );
            } else {
                result = await handler(call.args);
            }

            return {
                success: true,
                output: result
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error handling tool call';
            console.error(`Errore nell'esecuzione dello strumento ${call.tool}:`, error);
            this.sendErrorResponse(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Invia una risposta di successo
     */
    private sendSuccessResponse(result: string): void {
        const message = safeCastAs<WebviewMessage>({
            type: "llm.result",
            payload: {
                result
            }
        }, isResponseMessage);
        
        if (message) {
            this.callback(message);
        } else {
            console.error('Errore nella creazione del messaggio di risposta');
        }
    }

    /**
     * Invia una risposta di errore
     */
    private sendErrorResponse(error: string): void {
        const message = safeCastAs<WebviewMessage>({
            type: "llm.error",
            payload: {
                error
            }
        }, isErrorMessage);
        
        if (message) {
            this.callback(message);
        } else {
            console.error('Errore nella creazione del messaggio di errore');
        }
    }
}