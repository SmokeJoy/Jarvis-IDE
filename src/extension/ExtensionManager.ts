import * as vscode from 'vscode';
import { ConfigManager } from './ConfigManager';
import { LogManager } from './LogManager';
import { LLMManager } from './LLMManager';
import { WebviewManager } from './WebviewManager';
import { isExtensionMessage } from '@shared/messages';

export class ExtensionManager {
    private isActive = false;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly configManager: ConfigManager,
        private readonly logManager: LogManager,
        private readonly llmManager: LLMManager,
        private readonly webviewManager: WebviewManager
    ) {}

    public async initialize(): Promise<void> {
        try {
            // Initialize configuration
            await this.configManager.initialize();

            // Initialize webview
            this.webviewManager.initialize();

            // Setup message handlers
            this.setupMessageHandlers();

            this.logManager.info('ExtensionManager initialized successfully');
        } catch (error) {
            this.logManager.error('Failed to initialize ExtensionManager:', error);
            throw error;
        }
    }

    public start(): void {
        if (this.isActive) {
            this.logManager.warn('ExtensionManager is already active');
            return;
        }

        try {
            this.isActive = true;
            this.webviewManager.show();
            this.logManager.info('ExtensionManager started successfully');
        } catch (error) {
            this.logManager.error('Failed to start ExtensionManager:', error);
            this.isActive = false;
            throw error;
        }
    }

    public stop(): void {
        if (!this.isActive) {
            this.logManager.warn('ExtensionManager is not active');
            return;
        }

        try {
            this.isActive = false;
            this.webviewManager.hide();
            this.logManager.info('ExtensionManager stopped successfully');
        } catch (error) {
            this.logManager.error('Failed to stop ExtensionManager:', error);
            throw error;
        }
    }

    public dispose(): void {
        try {
            this.stop();
            this.webviewManager.dispose();
            this.llmManager.dispose();
            this.logManager.info('ExtensionManager disposed successfully');
        } catch (error) {
            this.logManager.error('Failed to dispose ExtensionManager:', error);
            throw error;
        }
    }

    private setupMessageHandlers(): void {
        // Handle messages from webview
        this.webviewManager.onMessage(async (message: unknown) => {
            try {
                if (!isExtensionMessage(message)) {
                    throw new Error('Invalid message format');
                }

                switch (message.type) {
                    case 'llm.query':
                        const response = await this.llmManager.query((msg.payload as unknown).prompt);
                        this.webviewManager.postMessage({
                            type: 'llm.response',
                            payload: { response }
                        });
                        break;

                    case 'config.update':
                        await this.configManager.updateConfig((msg.payload as unknown));
                        break;

                    default:
                        this.logManager.warn(`Unhandled message type: ${message.type}`);
                }
            } catch (error) {
                this.logManager.error('Error handling message:', error);
                this.webviewManager.postMessage({
                    type: 'error',
                    payload: { message: 'Failed to process request' }
                });
            }
        });
    }
} 