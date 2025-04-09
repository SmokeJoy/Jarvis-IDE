import { logger } from "../../utils/logger";
export class McpHub {
    constructor() {
        this.connection = null;
        this.servers = [];
        this.mode = "off";
        this.provider = null;
        this.apiConfig = null;
        this.name = "McpHub";
        this.config = "";
        this.status = "disconnected";
        this.disabled = false;
        logger.debug("[McpHub] Inizializzato");
    }
    connect(provider, config) {
        this.provider = provider;
        this.apiConfig = config;
        this.status = "connecting";
        logger.info("[McpHub] Connessione stabilita con il provider");
        const connection = {
            client: {
                stop: async () => {
                    // Implementazione del metodo stop
                },
                on: (event, listener) => {
                    // Implementazione dell'handler degli eventi
                }
            }
        };
        this.connection = connection;
        this.status = "connected";
        return connection;
    }
    async getMode() {
        return this.mode;
    }
    async getServers() {
        return this.servers;
    }
    async getMcpServersPath() {
        return "./mcp-servers";
    }
    async getMcpSettingsFilePath() {
        return "./mcp-settings.json";
    }
    getConnection() {
        if (!this.connection) {
            throw new Error("[McpHub] Nessuna connessione attiva");
        }
        return this.connection;
    }
    async dispose() {
        // Cleanup resources
        await this.disconnect();
    }
    async toggleServerDisabled(serverName, disabled) {
        const server = await this.getServer(serverName);
        if (server) {
            server.disabled = disabled;
            await this.saveServers();
        }
    }
    async toggleToolAutoApprove(serverName, toolNames, autoApprove) {
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
    async restartConnection(text) {
        await this.disconnect();
        await this.connect(this.provider, this.apiConfig);
    }
    async deleteServer(serverName) {
        if (serverName) {
            const servers = await this.getServers();
            const index = servers.findIndex(s => s.name === serverName);
            if (index !== -1) {
                servers.splice(index, 1);
                await this.saveServers();
            }
        }
    }
    sendLatestMcpServers() {
        // Implementazione
    }
    async updateServerTimeout(serverName, timeout) {
        const server = await this.getServer(serverName);
        if (server) {
            server.timeout = timeout; // Using type assertion since timeout is not in McpServer type
            await this.saveServers();
        }
    }
    disconnect() {
        if (this.connection) {
            logger.info("[McpHub] Disconnessione dal provider");
            this.connection = null;
            this.provider = null;
            this.apiConfig = null;
            this.status = "disconnected";
        }
    }
    async sendMessage(messages) {
        if (!this.connection) {
            throw new Error("Not connected to MCP hub");
        }
        try {
            await this.connection.client.invoke("SendMessage", {
                connectionId: this.connection.connectionId,
                userId: this.connection.userId,
                messages,
            });
        }
        catch (error) {
            console.error("Error sending message to MCP hub:", error);
            throw error;
        }
    }
    onMessage(callback) {
        if (!this.connection) {
            throw new Error("Not connected to MCP hub");
        }
        this.connection.client.on("ReceiveMessage", callback);
    }
    async getServer(name) {
        const servers = await this.getServers();
        return servers.find(s => s.name === name);
    }
    async saveServers() {
        // Implementation
    }
    async getTool(name) {
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
    async getResource(name) {
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
    async getResourceTemplate(name) {
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
//# sourceMappingURL=McpHub.js.map