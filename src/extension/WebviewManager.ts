import * as vscode from 'vscode';
import * as path from 'path';

export class WebviewManager {
    private panel: vscode.WebviewPanel | undefined;
    private readonly viewType = 'jarvis-ide.webview';
    private readonly title = 'Jarvis IDE';
    private messageHandlers: ((message: any) => void)[] = [];

    constructor(private readonly context: vscode.ExtensionContext) {}

    public initialize(): void {
        // Register webview panel serializer for state persistence
        this.context.subscriptions.push(
            vscode.window.registerWebviewPanelSerializer(this.viewType, {
                async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                    webviewPanel.webview.options = this.getWebviewOptions();
                    webviewPanel.webview.html = await this.getWebviewContent();
                }
            })
        );
    }

    public show(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            this.viewType,
            this.title,
            vscode.ViewColumn.Two,
            this.getWebviewOptions()
        );

        this.panel.webview.html = this.getWebviewContent();

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.context.subscriptions);

        this.panel.webview.onDidReceiveMessage(
            message => {
                this.messageHandlers.forEach(handler => handler(message));
            },
            undefined,
            this.context.subscriptions
        );
    }

    public hide(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }

    public dispose(): void {
        this.hide();
        this.messageHandlers = [];
    }

    public postMessage(message: any): void {
        if (this.panel) {
            this.panel.webview.postMessage(message);
        }
    }

    public onMessage(handler: (message: any) => void): void {
        this.messageHandlers.push(handler);
    }

    private getWebviewOptions(): vscode.WebviewOptions {
        return {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(this.context.extensionPath, 'webview-ui', 'dist'))
            ]
        };
    }

    private getWebviewContent(): string {
        const webviewPath = path.join(this.context.extensionPath, 'webview-ui', 'dist');
        const scriptUri = vscode.Uri.file(path.join(webviewPath, 'index.js'))
            .with({ scheme: 'vscode-resource' });
        const styleUri = vscode.Uri.file(path.join(webviewPath, 'index.css'))
            .with({ scheme: 'vscode-resource' });

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Jarvis IDE</title>
                <link href="${styleUri}" rel="stylesheet">
            </head>
            <body>
                <div id="root"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
} 