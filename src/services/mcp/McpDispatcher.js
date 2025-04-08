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
/**
 * Dispatcher per il Model Control Protocol (MCP)
 * Gestisce le chiamate strumentali dei modelli
 */
export class McpDispatcher {
    constructor(callback) {
        this.callback = callback;
        // All'avvio, carica la memoria persistente
        this.memory = loadMemoryFromDisk();
    }
    /**
     * Gestisce una chiamata strumentale
     * @param call Chiamata strumentale
     */
    async handleToolCall(call) {
        console.log(`McpDispatcher: Gestione chiamata strumentale ${call.tool}`);
        try {
            let result;
            switch (call.tool) {
                case "read_file":
                    result = await readFileHandler(call.args);
                    break;
                case "search_docs":
                    result = await searchDocsHandler(call.args);
                    break;
                case "memory.query":
                    result = await memoryQueryHandler(call.args);
                    break;
                case "project.summary":
                    result = await projectSummaryHandler(call.args);
                    break;
                case "code.generate":
                    result = await codeGenerateHandler(call.args);
                    break;
                case "fs.write":
                    result = await fsWriteHandler(call.args);
                    break;
                case "refactor.snippet":
                    result = await refactorSnippetHandler(call.args);
                    break;
                case "ask.docs":
                    result = await askDocsHandler(call.args);
                    break;
                case "project.lint":
                    result = await projectLintHandler(call.args);
                    break;
                case "fs.format":
                    result = await fsFormatHandler(call.args);
                    break;
                case "test.run":
                    result = await testRunHandler(call.args);
                    break;
                case "project.depGraph":
                    result = await projectDepGraphHandler(call.args);
                    break;
                case "context.inject":
                    result = await contextInjectHandler(call.args);
                    break;
                case "context.list":
                    result = await contextListHandler(call.args);
                    break;
                case "context.clear":
                    result = await contextClearHandler(call.args);
                    break;
                case "context.tag":
                    result = await contextTagHandler(call.args);
                    break;
                case "context.searchByTags":
                    result = await contextSearchByTagsHandler(call.args);
                    break;
                case "context.export":
                    result = await contextExportHandler(call.args);
                    break;
                case "context.import":
                    result = await contextImportHandler(call.args);
                    break;
                case "context.edit":
                    result = await contextEditHandler(call.args);
                    break;
                case "context.link":
                    result = await contextLinkHandler(call.args);
                    break;
                case "context.linksOf":
                    result = await contextLinksOfHandler(call.args);
                    break;
                case "context.graph":
                    result = await contextGraphHandler(call.args);
                    break;
                case "context.unlink":
                    result = await contextUnlinkHandler(call.args);
                    break;
                case "context.graphExport":
                    result = await contextGraphExportHandler({
                        ...call.args,
                        format: 'dot'
                    });
                    break;
                case "context.navigate":
                    result = await contextNavigateHandler(JSON.stringify(call.args), JSON.stringify(this.memory), 'semantic');
                    break;
                default:
                    throw new Error(`Unknown tool: ${call.tool}`);
            }
            return {
                success: true,
                output: result
            };
        }
        catch (error) {
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
    sendSuccessResponse(result) {
        const message = {
            type: "llm.result",
            payload: {
                result
            }
        };
        this.callback(message);
    }
    /**
     * Invia una risposta di errore
     */
    sendErrorResponse(error) {
        const message = {
            type: "llm.error",
            payload: {
                error
            }
        };
        this.callback(message);
    }
}
//# sourceMappingURL=McpDispatcher.js.map