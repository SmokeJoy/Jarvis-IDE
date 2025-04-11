import { ChatCompletionMessageParam } from "../../types/provider-types/openai-types.js";
import { ApiConfiguration } from "../../shared/types/api.types.js";
import { JarvisProvider } from "../../core/webview/JarvisProvider.js";
import { McpServer, McpConnection, McpTool, McpResource, McpResourceTemplate } from "../../shared/mcp.js";
export interface StdioClientTransport {
    command: string;
    args: string[];
    env: Record<string, string>;
    stderr: {
        on(event: "data", listener: (data: Buffer) => void): void;
    };
    start(): Promise<void>;
}
export interface SSEClientTransport {
    url: string;
    headers: Record<string, string>;
}
export type ClientTransport = StdioClientTransport | SSEClientTransport;
export declare class McpHub implements McpServer {
    private connection;
    private servers;
    private mode;
    private provider;
    private apiConfig;
    name: string;
    config: string;
    status: "connecting" | "connected" | "disconnected";
    disabled: boolean;
    error?: string;
    tools?: McpTool[];
    resources?: McpResource[];
    resourceTemplates?: McpResourceTemplate[];
    constructor();
    connect(provider: JarvisProvider, config: ApiConfiguration): McpConnection;
    getMode(): Promise<string>;
    getServers(): Promise<McpServer[]>;
    getMcpServersPath(): Promise<string>;
    getMcpSettingsFilePath(): Promise<string>;
    getConnection(): McpConnection;
    dispose(): Promise<void>;
    toggleServerDisabled(serverName: string, disabled: boolean): Promise<void>;
    toggleToolAutoApprove(serverName: string, toolNames: string[], autoApprove: boolean): Promise<void>;
    restartConnection(text: string): Promise<void>;
    deleteServer(serverName?: string): Promise<void>;
    sendLatestMcpServers(): void;
    updateServerTimeout(serverName: string, timeout: number): Promise<void>;
    disconnect(): void;
    sendMessage(messages: ChatCompletionMessageParam[]): Promise<void>;
    onMessage(callback: (message: string) => void): void;
    private getServer;
    private saveServers;
    getTool(name: string): Promise<McpTool>;
    getResource(name: string): Promise<McpResource>;
    getResourceTemplate(name: string): Promise<McpResourceTemplate>;
}
//# sourceMappingURL=McpHub.d.ts.map