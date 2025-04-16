// import { FallbackMonitorPanel } from '@jarvis/visix'; // Commentato - Modulo non trovato
import * as vscode from 'vscode';
import * as path from 'path';
import { LLMEventBus } from '../mas/core/fallback/LLMEventBus';
import { FallbackStrategy } from '../mas/core/fallback/strategies/FallbackStrategy';

export class VisixPanel {
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly eventBus: LLMEventBus,
    private readonly strategy: FallbackStrategy,
    private readonly providers: string[]
  ) {}

  public show() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'visix.monitor',
      'Fallback Monitor',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionUri.fsPath, 'dist'))],
        scriptSrc: ["'unsafe-inline'", this.panel?.webview.cspSource],
      }
    );

    this.panel.webview.html = "<html><body>Visix Panel Disabilitato (Modulo non trovato)</body></html>"; // Fallback HTML

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.disposables.forEach((d) => d.dispose());
      },
      null,
      this.disposables
    );
  }

  private getWebviewContent(): string {
    const reactAppUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionUri.fsPath, 'dist', 'visix.esm.js'))
    );

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fallback Monitor</title>
          <style>
            body {
              padding: 0;
              margin: 0;
              background-color: var(--vscode-editor-background);
              color: var(--vscode-editor-foreground);
            }
            #root {
              padding: 1rem;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">
            import { FallbackMonitorPanel } from '${reactAppUri}';
            import React from 'react';
            import { createRoot } from 'react-dom/client';

            const root = createRoot(document.getElementById('root'));
            root.render(
              React.createElement(FallbackMonitorPanel, {
                eventBus: window.eventBus,
                strategy: window.strategy,
                providers: window.providers
              })
            );
          </script>
        </body>
      </html>
    `;
  }

  public dispose() {
    this.panel?.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
