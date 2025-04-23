import * as vscode from 'vscode';
import { ExtensionConfig } from '@shared/types/config';

export class ConfigManager {
    private config: ExtensionConfig = {
        provider: '',
        apiKey: '',
        baseUrl: '',
        use_docs: false,
        coder_mode: true,
        multi_agent: false
    };

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async initialize(): Promise<void> {
        // Load configuration from VS Code settings
        const config = vscode.workspace.getConfiguration('jarvis-ide');

        this.config = {
            provider: config.get<string>('provider', ''),
            apiKey: await this.getSecretApiKey() || '',
            baseUrl: config.get<string>('baseUrl', ''),
            use_docs: config.get<boolean>('use_docs', false),
            coder_mode: config.get<boolean>('coder_mode', true),
            multi_agent: config.get<boolean>('multi_agent', false)
        };
    }

    public async updateConfig(newConfig: Partial<ExtensionConfig>): Promise<void> {
        const config = vscode.workspace.getConfiguration('jarvis-ide');

        // Update VS Code settings
        for (const [key, value] of Object.entries(newConfig)) {
            if (key === 'apiKey') {
                await this.setSecretApiKey(value as string);
            } else {
                await config.update(key, value, vscode.ConfigurationTarget.Global);
            }
        }

        // Update local config
        this.config = { ...this.config, ...newConfig };
    }

    public getConfig(): ExtensionConfig {
        return { ...this.config };
    }

    private async getSecretApiKey(): Promise<string | undefined> {
        try {
            return await this.context.secrets.get('jarvis-ide.apiKey');
        } catch (error) {
            console.error('Failed to get API key from secret storage:', error);
            return undefined;
        }
    }

    private async setSecretApiKey(apiKey: string): Promise<void> {
        try {
            await this.context.secrets.store('jarvis-ide.apiKey', apiKey);
        } catch (error) {
            console.error('Failed to store API key in secret storage:', error);
            throw error;
        }
    }
} 