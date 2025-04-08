import type { ChatCompletionMessageParam } from "../../types/provider-types/openai-types.js"
import type { ApiConfiguration } from "../../shared/types/api.types.js"
import type { JarvisProvider } from "../../core/webview/JarvisProvider.js"
import type { McpServer, McpConnection, McpTool, McpResource, McpResourceTemplate } from "../../shared/mcp.js"
import { logger } from "../../utils/logger.js"

export interface StdioClientTransport {
	command: string;
	args: string[];
	env: Record<string, string>;
	stderr: { on(event: "data", listener: (data: Buffer) => void): void };
	start(): Promise<void>;
}

export interface SSEClientTransport {
	url: string;
	headers: Record<string, string>;
}

export type ClientTransport = StdioClientTransport | SSEClientTransport;

export class McpHub implements McpServer {
	private connection: McpConnection | null = null;
	private servers: McpServer[] = [];
	private mode: string = "off";
	private provider: JarvisProvider | null = null;
	private apiConfig: ApiConfiguration | null = null;

	public name: string = "McpHub";
	public config: string = "";
	public status: "connecting" | "connected" | "disconnected" = "disconnected";
	public disabled: boolean = false;
	public error?: string;
	public tools?: McpTool[];
	public resources?: McpResource[];
	public resourceTemplates?: McpResourceTemplate[];

	constructor() {
		logger.debug("[McpHub] Inizializzato");
	}

	connect(provider: JarvisProvider, config: ApiConfiguration): McpConnection {
		this.provider = provider;
		this.apiConfig = config;
		this.status = "connecting";

		logger.info("[McpHub] Connessione stabilita con il provider");

		const connection: McpConnection = {
			client: {
				stop: async () => {
					// Implementazione del metodo stop
				},
				on: (event: string, listener: (...args: any[]) => void) => {
					// Implementazione dell'handler degli eventi
				}
			}
		};

		this.connection = connection;
		this.status = "connected";
		return connection;
	}

	async getMode(): Promise<string> {
		return this.mode;
	}

	async getServers(): Promise<McpServer[]> {
		return this.servers;
	}

	async getMcpServersPath(): Promise<string> {
		return "./mcp-servers";
	}

	async getMcpSettingsFilePath(): Promise<string> {
		return "./mcp-settings.json";
	}

	getConnection(): McpConnection {
		if (!this.connection) {
			throw new Error("[McpHub] Nessuna connessione attiva");
		}
		return this.connection;
	}

	async dispose(): Promise<void> {
		// Cleanup resources
		await this.disconnect();
	}

	async toggleServerDisabled(serverName: string, disabled: boolean): Promise<void> {
		const server = await this.getServer(serverName);
		if (server) {
			server.disabled = disabled;
			await this.saveServers();
		}
	}

	async toggleToolAutoApprove(serverName: string, toolNames: string[], autoApprove: boolean): Promise<void> {
		const server = await this.getServer(serverName);
		if (server && server.tools) {
			for (const toolName of toolNames) {
				const tool = server.tools.find(t => t.name === toolName);
				if (tool) {
					tool.autoApprove = autoApprove;
				}
			}
			await this.saveServers();
		}
	}

	async restartConnection(text: string): Promise<void> {
		await this.disconnect();
		await this.connect(this.provider!, this.apiConfig!);
	}

	async deleteServer(serverName?: string): Promise<void> {
		if (serverName) {
			const servers = await this.getServers();
			const index = servers.findIndex(s => s.name === serverName);
			if (index !== -1) {
				servers.splice(index, 1);
				await this.saveServers();
			}
		}
	}

	sendLatestMcpServers(): void {
		// Implementazione
	}

	async updateServerTimeout(serverName: string, timeout: number): Promise<void> {
		const server = await this.getServer(serverName);
		if (server) {
			(server as any).timeout = timeout; // Using type assertion since timeout is not in McpServer type
			await this.saveServers();
		}
	}

	disconnect(): void {
		if (this.connection) {
			logger.info("[McpHub] Disconnessione dal provider");
			this.connection = null;
			this.provider = null;
			this.apiConfig = null;
			this.status = "disconnected";
		}
	}

	async sendMessage(messages: ChatCompletionMessageParam[]): Promise<void> {
		if (!this.connection) {
			throw new Error("Not connected to MCP hub");
		}

		try {
			await this.connection.client.invoke("SendMessage", {
				connectionId: this.connection.connectionId,
				userId: this.connection.userId,
				messages,
			});
		} catch (error) {
			console.error("Error sending message to MCP hub:", error);
			throw error;
		}
	}

	onMessage(callback: (message: string) => void): void {
		if (!this.connection) {
			throw new Error("Not connected to MCP hub");
		}

		this.connection.client.on("ReceiveMessage", callback);
	}

	private async getServer(name: string): Promise<McpServer | undefined> {
		const servers = await this.getServers();
		return servers.find(s => s.name === name);
	}

	private async saveServers(): Promise<void> {
		// Implementation
	}

	async getTool(name: string): Promise<McpTool> {
		if (!this.provider || !this.apiConfig) {
			throw new Error("[McpHub] Provider o configurazione non disponibili");
		}

		logger.debug(`[McpHub] Richiesta tool: ${name}`);

		return {
			name,
			description: "Tool di esempio",
			parameters: {},
			autoApprove: false
		};
	}

	async getResource(name: string): Promise<McpResource> {
		if (!this.provider || !this.apiConfig) {
			throw new Error("[McpHub] Provider o configurazione non disponibili");
		}

		logger.debug(`[McpHub] Richiesta risorsa: ${name}`);

		return {
			uri: `resource://${name}`,
			type: "text",
			name,
			description: "Risorsa di esempio",
			metadata: {}
		};
	}

	async getResourceTemplate(name: string): Promise<McpResourceTemplate> {
		if (!this.provider || !this.apiConfig) {
			throw new Error("[McpHub] Provider o configurazione non disponibili");
		}

		logger.debug(`[McpHub] Richiesta template risorsa: ${name}`);

		return {
			type: "text",
			name,
			description: "Template di esempio",
			parameters: {}
		};
	}
}
