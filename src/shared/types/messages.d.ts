export interface WebviewMessage {
    type: string;
    payload: unknown;
}
export interface McpToolCall {
    tool: string;
    args: unknown;
    requestId?: string;
}
export interface ToolResponse {
    success: boolean;
    output?: unknown;
    error?: string;
}
//# sourceMappingURL=messages.d.ts.map