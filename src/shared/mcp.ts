import type { ApiConfiguration } from "./types/api.types.js.js"
import type { ChatMessage } from "./types/message.js.js"
import type { McpServer, McpMarketplaceCatalog, McpMarketplaceItem, McpDownloadResponse } from "./types/mcp.types.js.js"
import type { McpTool, McpResource, McpResourceTemplate, McpResourceResponse, McpToolCallResponse, McpMode, McpConnection } from "./types/mcp.types.js.js"

export const DEFAULT_MCP_TIMEOUT_SECONDS = 60 // matches Anthropic's default timeout in their MCP SDK
export const MIN_MCP_TIMEOUT_SECONDS = 30

// Esporta i tipi per retrocompatibilità
export type {
	McpServer,
	McpConnection,
	McpTool,
	McpResource,
	McpResourceTemplate,
	McpResourceResponse,
	McpToolCallResponse,
	McpMarketplaceItem,
	McpMarketplaceCatalog,
	McpDownloadResponse,
	McpMode
}
