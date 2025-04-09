import type { WebviewMessage, McpToolCall, ToolResponse } from '@shared/types/messages.js';
import type { isErrorMessage, isResponseMessage, safeCastAs } from '@/shared/types/webviewMessageUnion.js';
import type { readFileHandler } from './handlers/readFileHandler.js.js';
import type { searchDocsHandler } from './handlers/searchDocsHandler.js.js';
import type { memoryQueryHandler } from './handlers/memoryQueryHandler.js.js';
import type { projectSummaryHandler } from './handlers/projectSummaryHandler.js.js';
import type { codeGenerateHandler } from './handlers/codeGenerateHandler.js.js';
import type { fsWriteHandler } from './handlers/fsWriteHandler.js.js';
import type { refactorSnippetHandler } from './handlers/refactorSnippetHandler.js.js';
import type { askDocsHandler } from './handlers/askDocsHandler.js.js';
import type { projectLintHandler } from './handlers/projectLintHandler.js.js';
import type { fsFormatHandler } from './handlers/fsFormatHandler.js.js';
import type { testRunHandler } from './handlers/testRunHandler.js.js';
import type { projectDepGraphHandler } from './handlers/projectDepGraphHandler.js.js';
import type { contextInjectHandler } from './handlers/contextInjectHandler.js.js';
import type { contextListHandler } from './handlers/contextListHandler.js.js';
import type { contextClearHandler } from './handlers/contextClearHandler.js.js';
import type { contextTagHandler } from './handlers/contextTagHandler.js.js';
import type { contextSearchByTagsHandler } from './handlers/contextSearchByTagsHandler.js.js';
import type { contextExportHandler } from './handlers/contextExportHandler.js.js';
import type { contextImportHandler } from './handlers/contextImportHandler.js.js';
import type { contextEditHandler } from './handlers/contextEditHandler.js.js';
import type { contextLinkHandler } from './handlers/contextLinkHandler.js.js';
import type { contextLinksOfHandler } from './handlers/contextLinksOfHandler.js.js';
import type { contextGraphHandler } from './handlers/contextGraphHandler.js.js';
import type { contextUnlinkHandler } from './handlers/contextUnlinkHandler.js.js';
import type { contextGraphExportHandler } from './handlers/contextGraphExportHandler.js.js';
import type { contextNavigateHandler } from './handlers/contextNavigateHandler.js.js';
import { loadMemoryFromDisk } from './memory/memory.js.js';
import type { Memory } from './memory/memory.js.js';
import type {
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
} from './types/handler.types.js.js';

/**
 * Dispatcher per il Model Control Protocol (MCP)
 * Gestisce le chiamate strumentali dei modelli
 */
export class McpDispatcher {
    private memory: Memory;

    constructor(private callback: (message: WebviewMessage) => void) {
        // All'avvio, carica la memoria persistente
        this.memory = loadMemoryFromDisk();
    }

    /**
     * Gestisce una chiamata strumentale
     * @param call Chiamata strumentale
     */
    async handleToolCall(call: McpToolCall): Promise<ToolResponse> {
        console.log(`McpDispatcher: Gestione chiamata strumentale ${call.tool}`);

        try {
            let result: unknown;
            switch (call.tool) {
                case "read_file":
                    result = await readFileHandler(call.args as ReadFileArgs);
                    break;
                case "search_docs":
                    result = await searchDocsHandler(call.args as SearchDocsArgs);
                    break;
                case "memory.query":
                    result = await memoryQueryHandler(call.args as MemoryQueryArgs);
                    break;
                case "project.summary":
                    result = await projectSummaryHandler(call.args as ProjectSummaryArgs);
                    break;
                case "code.generate":
                    result = await codeGenerateHandler(call.args as CodeGenerateArgs);
                    break;
                case "fs.write":
                    result = await fsWriteHandler(call.args as FsWriteArgs);
                    break;
                case "refactor.snippet":
                    result = await refactorSnippetHandler(call.args as RefactorSnippetArgs);
                    break;
                case "ask.docs":
                    result = await askDocsHandler(call.args as AskDocsArgs);
                    break;
                case "project.lint":
                    result = await projectLintHandler(call.args as ProjectLintArgs);
                    break;
                case "fs.format":
                    result = await fsFormatHandler(call.args as FsFormatArgs);
                    break;
                case "test.run":
                    result = await testRunHandler(call.args as TestRunArgs);
                    break;
                case "project.depGraph":
                    result = await projectDepGraphHandler(call.args as ProjectDepGraphArgs);
                    break;
                case "context.inject":
                    result = await contextInjectHandler(call.args as ContextInjectArgs);
                    break;
                case "context.list":
                    result = await contextListHandler(call.args as ContextListArgs);
                    break;
                case "context.clear":
                    result = await contextClearHandler(call.args as ContextClearArgs);
                    break;
                case "context.tag":
                    result = await contextTagHandler(call.args as ContextTagArgs);
                    break;
                case "context.searchByTags":
                    result = await contextSearchByTagsHandler(call.args as ContextSearchByTagsArgs);
                    break;
                case "context.export":
                    result = await contextExportHandler(call.args as ContextExportArgs);
                    break;
                case "context.import":
                    result = await contextImportHandler(call.args as ContextImportArgs);
                    break;
                case "context.edit":
                    result = await contextEditHandler(call.args as ContextEditArgs);
                    break;
                case "context.link":
                    result = await contextLinkHandler(call.args as ContextLinkArgs);
                    break;
                case "context.linksOf":
                    result = await contextLinksOfHandler(call.args as ContextLinksOfArgs);
                    break;
                case "context.graph":
                    result = await contextGraphHandler(call.args as ContextGraphArgs);
                    break;
                case "context.unlink":
                    result = await contextUnlinkHandler(call.args as ContextUnlinkArgs);
                    break;
                case "context.graphExport":
                    result = await contextGraphExportHandler({
                        ...call.args as ContextGraphExportArgs,
                        format: 'dot'
                    });
                    break;
                case "context.navigate":
                    result = await contextNavigateHandler(
                        JSON.stringify(call.args as ContextNavigateArgs),
                        JSON.stringify(this.memory),
                        'semantic'
                    );
                    break;
                default:
                    throw new Error(`Unknown tool: ${call.tool}`);
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
    private sendSuccessResponse(result: string) {
        // Utilizzo di safeCastAs per garantire la validazione del tipo a runtime
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
    private sendErrorResponse(error: string) {
        // Utilizzo di safeCastAs per garantire la validazione del tipo a runtime
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