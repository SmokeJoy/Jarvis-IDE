/**
 * @file mcp.types.ts
 * @description Tipi per l'integrazione MCP (Model Control Protocol)
 */

/**
 * Definizioni di tipi per il protocollo MCP (Multi-agent Communication Protocol)
 */

/**
 * Modalità operative del sistema MCP
 */
export type McpMode = "off" | "minimal" | "full";

/**
 * Rappresentazione di un server MCP
 */
export interface McpServer {
  name: string;
  config: string;
  status: "connecting" | "connected" | "disconnected";
  disabled: boolean;
  error?: string;
  tools?: McpTool[];
  resources?: McpResource[];
  resourceTemplates?: McpResourceTemplate[];
}

/**
 * Connessione a un server MCP
 */
export interface McpConnection {
  server: McpServer;
  client: any;
  transport: any; // StdioClientTransport | SSEClientTransport
  connectionId: string;
  userId: string;
}

/**
 * Rappresentazione di uno strumento MCP
 */
export interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  autoApprove?: boolean;
}

/**
 * Rappresentazione di una risorsa MCP
 */
export interface McpResource {
  id: string;
  name: string;
  description?: string;
  type: string;
  content: any;
}

/**
 * Rappresentazione di un template di risorsa
 */
export interface McpResourceTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  schema: any;
}

/**
 * Risposta alla creazione di una risorsa
 */
export interface McpResourceResponse {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Risposta alla chiamata di uno strumento
 */
export interface McpToolCallResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Informazioni sul catalogo del marketplace MCP
 */
export interface McpMarketplaceCatalog {
  items: McpMarketplaceItem[];
}

/**
 * Elemento del marketplace MCP
 */
export interface McpMarketplaceItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
  version: string;
  author: string;
  repository?: string;
  tags?: string[];
  downloadCount?: number;
}

/**
 * Risposta al download di un elemento dal marketplace
 */
export interface McpDownloadResponse {
  success: boolean;
  message?: string;
  path?: string;
}

export interface McpToolCall {
  requestId: string;
  tool: string;
  args: Record<string, any>;
}

export interface McpToolResponse {
  result?: string;
  error?: string;
}

/**
 * Risultato standardizzato di un handler tool MCP
 */
export interface McpToolResult {
  success: boolean;
  output: any | null;
  error?: string;
}

/**
 * Firma per gli handler di tool MCP
 */
export type McpToolHandler = (args: Record<string, any>) => Promise<McpToolResult>; 