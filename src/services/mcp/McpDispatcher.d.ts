import { WebviewMessage, McpToolCall, ToolResponse } from '@shared/types/messages';
/**
 * Dispatcher per il Model Control Protocol (MCP)
 * Gestisce le chiamate strumentali dei modelli
 */
export declare class McpDispatcher {
  private callback;
  private memory;
  constructor(callback: (message: WebviewMessage) => void);
  /**
   * Gestisce una chiamata strumentale
   * @param call Chiamata strumentale
   */
  handleToolCall(call: McpToolCall): Promise<ToolResponse>;
  /**
   * Invia una risposta di successo
   */
  private sendSuccessResponse;
  /**
   * Invia una risposta di errore
   */
  private sendErrorResponse;
}
//# sourceMappingURL=McpDispatcher.d.ts.map
