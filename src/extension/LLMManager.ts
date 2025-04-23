import * as vscode from 'vscode';
import { ConfigManager } from './ConfigManager';
import { AnthropicHandler } from './llm/AnthropicHandler';
import { OpenAIHandler } from './llm/OpenAIHandler';
import { OllamaHandler } from './llm/OllamaHandler';
import { LMStudioHandler } from './llm/LMStudioHandler';
import { LLMHandler } from './llm/LLMHandler';
import { LLMProvider } from '@shared/types/llm';

export class LLMManager {
    private handler: LLMHandler | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly configManager: ConfigManager
    ) {}

    public async query(prompt: string): Promise<string> {
        const handler = await this.getHandler();
        return handler.query(prompt);
    }

    public async streamQuery(prompt: string, onToken: (token: string) => void): Promise<void> {
        const handler = await this.getHandler();
        return handler.streamQuery(prompt, onToken);
    }

    public dispose(): void {
        if (this.handler) {
            this.handler.dispose();
            this.handler = undefined;
        }
    }

    private async getHandler(): Promise<LLMHandler> {
        const config = this.configManager.getConfig();

        // Return existing handler if provider hasn't changed
        if (this.handler?.provider === config.provider) {
            return this.handler;
        }

        // Dispose existing handler
        if (this.handler) {
            this.handler.dispose();
            this.handler = undefined;
        }

        // Create new handler based on provider
        switch (config.provider as LLMProvider) {
            case 'anthropic':
                this.handler = new AnthropicHandler(config);
                break;
            case 'openai':
                this.handler = new OpenAIHandler(config);
                break;
            case 'ollama':
                this.handler = new OllamaHandler(config);
                break;
            case 'lmstudio':
                this.handler = new LMStudioHandler(config);
                break;
            default:
                throw new Error(`Unsupported LLM provider: ${config.provider}`);
        }

        return this.handler;
    }
} 