/**
 * 🛠️ Fix TypeScript – 2025-04-10
 * - Importazioni corrette
 * - Tipizzazione mock/test
 * - Eliminazione impliciti
 */

import { WebviewMessage, McpToolCall, ToolResponse } from '../../shared/types/chat.types';
import {
  isErrorMessage,
  isResponseMessage,
  safeCastAs,
} from '../../shared/types/webviewMessageUnion';
import { readFileHandler } from './handlers/readFileHandler';
import { searchDocsHandler } from './handlers/searchDocsHandler';
import { memoryQueryHandler } from './handlers/memoryQueryHandler';
import { projectSummaryHandler } from './handlers/projectSummaryHandler';
import { codeGenerateHandler } from './handlers/codeGenerateHandler';
import { fsWriteHandler } from './handlers/fsWriteHandler';
import { refactorSnippetHandler } from './handlers/refactorSnippetHandler';
import { askDocsHandler } from './handlers/askDocsHandler';
import { projectLintHandler } from './handlers/projectLintHandler';
import { fsFormatHandler } from './handlers/fsFormatHandler';
import { testRunHandler } from './handlers/testRunHandler';
import { projectDepGraphHandler } from './handlers/projectDepGraphHandler';
import { contextInjectHandler } from './handlers/contextInjectHandler';
import { contextListHandler } from './handlers/contextListHandler';
import { contextClearHandler } from './handlers/contextClearHandler';
import { contextTagHandler } from './handlers/contextTagHandler';
import { contextSearchByTagsHandler } from './handlers/contextSearchByTagsHandler';
import { contextExportHandler } from './handlers/contextExportHandler';
import { contextImportHandler } from './handlers/contextImportHandler';
import { contextEditHandler } from './handlers/contextEditHandler';
import { contextLinkHandler } from './handlers/contextLinkHandler';
import { contextLinksOfHandler } from './handlers/contextLinksOfHandler';
import { contextGraphHandler } from './handlers/contextGraphHandler';
import { contextUnlinkHandler } from './handlers/contextUnlinkHandler';
import { contextGraphExportHandler } from './handlers/contextGraphExportHandler';
import { contextNavigateHandler } from './handlers/contextNavigateHandler';
import { loadMemoryFromDisk } from './memory/memory';
import { Memory } from './memory/memory';
import {
  ContextGraphArgs,
  ContextUnlinkArgs,
  ContextGraphExportArgs,
  ContextNavigateArgs,
} from './types/handler.types';
import { NavigationOptions } from './types/navigation.types';

type HandlerFunction<T = Record<string, unknown>, R = unknown> = (args: T) => Promise<R>;

interface HandlerMap {
  read_file: typeof readFileHandler;
  search_docs: typeof searchDocsHandler;
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
    read_file: readFileHandler,
    search_docs: searchDocsHandler,
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
    'context.navigate': contextNavigateHandler,
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
          ...(call.args as ContextGraphExportArgs),
          format: 'dot',
        });
      } else if (call.tool === 'context.navigate') {
        const args = call.args as ContextNavigateArgs;
        const options: NavigationOptions = {
          ...args.options,
          minStrength: args.options?.minStrength ?? 0.5,
          minConfidence: args.options?.minConfidence ?? 0.7,
        };

        result = await handler(
          args.startId,
          args.targetId ?? null,
          args.mode ?? 'semantic',
          options,
          args.includeContent ?? false,
          args.includeProviderFields ?? false,
          args.format ?? 'graph'
        );
      } else {
        result = await handler(call.args);
      }

      return {
        success: true,
        output: result,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error handling tool call';
      console.error(`Errore nell'esecuzione dello strumento ${call.tool}:`, error);
      this.sendErrorResponse(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Invia una risposta di successo
   */
  private sendSuccessResponse(result: string): void {
    const message = safeCastAs<WebviewMessage>(
      {
        type: 'llm.result',
        payload: {
          result,
        },
      },
      isResponseMessage
    );

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
    const message = safeCastAs<WebviewMessage>(
      {
        type: 'llm.error',
        payload: {
          error,
        },
      },
      isErrorMessage
    );

    if (message) {
      this.callback(message);
    } else {
      console.error('Errore nella creazione del messaggio di errore');
    }
  }
}
