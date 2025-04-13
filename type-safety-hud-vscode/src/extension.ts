import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Ignoriamo i problemi di tipo con il modulo type-safety-hud
import { analyzeFile, analyzeProject, generateHtmlDashboard } from 'type-safety-hud';

// Define interfaces to represent the return types from the type-safety-hud package
interface FileAnalysisResult {
  filePath: string;
  anyCount: number;
  jsImportsCount: number;
  summary: string;
}

interface ProjectAnalysisResult {
  files: Record<string, unknown>;
  filesCount: number;
  filesWithAnyCount: number;
  filesWithJsImportsCount: number;
  highPriorityCount: number;
  summary: string;
}

/**
 * This method is called when the extension is activated
 * Extension is activated the first time the command is executed
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Type Safety HUD extension is now active!');

  // Register command to show dashboard
  const showDashboardCommand = vscode.commands.registerCommand(
    'type-safety-hud.showDashboard',
    () => {
      // Create and show a WebView panel
      const panel = vscode.window.createWebviewPanel(
        'typeSafetyHUDDashboard', // Identifies the type of the webview
        'Type Safety HUD Dashboard', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the panel in
        {
          enableScripts: true, // Enable JavaScript in the webview
          retainContextWhenHidden: true, // Keep the webview in memory when hidden
        }
      );

      // Set initial loading content
      panel.webview.html = getLoadingContent();
      
      // Show a message to the user
      vscode.window.showInformationMessage('Generating TypeScript type safety dashboard...');
      
      // Analyze the workspace and generate the dashboard
      const projectRoot = vscode.workspace.rootPath || '';
      
      // Get configuration for excluding patterns
      const config = vscode.workspace.getConfiguration('typeSafetyHUD');
      const excludePatterns = config.get<string[]>('excludePatterns') || [];
      
      generateHtmlDashboard(projectRoot, { excludePatterns })
        .then((html: string) => {
          // Update the webview content with the generated HTML
          panel.webview.html = html;
          vscode.window.showInformationMessage('TypeScript type safety dashboard generated');
        })
        .catch((err: Error) => {
          panel.webview.html = getErrorContent(err.message);
          vscode.window.showErrorMessage(`Failed to generate dashboard: ${err.message}`);
        });
    }
  );

  // Register command to analyze current file
  const analyzeFileCommand = vscode.commands.registerCommand(
    'type-safety-hud.analyzeFile',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        if (document.languageId === 'typescript' || document.languageId === 'typescriptreact') {
          vscode.window.showInformationMessage(`Analyzing ${document.fileName} for type safety issues`);
          
          analyzeFile(document.fileName)
            .then((result: FileAnalysisResult) => {
              vscode.window.showInformationMessage(
                `Analysis done: ${result.summary}`
              );
            })
            .catch((err: Error) => {
              vscode.window.showErrorMessage(`Analysis failed: ${err.message}`);
            });
        } else {
          vscode.window.showWarningMessage('Type Safety HUD only works with TypeScript files');
        }
      } else {
        vscode.window.showWarningMessage('No active editor');
      }
    }
  );

  // Register command to analyze workspace
  const analyzeWorkspaceCommand = vscode.commands.registerCommand(
    'type-safety-hud.analyzeWorkspace',
    () => {
      vscode.window.showInformationMessage('Analyzing workspace for type safety issues');
      
      analyzeProject(vscode.workspace.rootPath || '')
        .then((report: ProjectAnalysisResult) => {
          vscode.window.showInformationMessage(
            `Workspace analysis completed. ${report.filesCount} files checked.`
          );
        })
        .catch((err: Error) => {
          vscode.window.showErrorMessage(`Workspace analysis failed: ${err.message}`);
        });
    }
  );

  // Add commands to context
  context.subscriptions.push(showDashboardCommand);
  context.subscriptions.push(analyzeFileCommand);
  context.subscriptions.push(analyzeWorkspaceCommand);
}

/**
 * Generates loading content for the WebView panel
 * @returns HTML content as a string
 */
function getLoadingContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Type Safety HUD</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 80vh;
          text-align: center;
        }
        .loader {
          border: 5px solid var(--vscode-button-background);
          border-radius: 50%;
          border-top: 5px solid var(--vscode-button-hoverBackground);
          width: 50px;
          height: 50px;
          animation: spin 2s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div>
        <h1>Generating TypeScript Type Safety Dashboard</h1>
        <p>Analyzing project files, please wait...</p>
        <div class="loader"></div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates error content for the WebView panel
 * @param errorMessage The error message to display
 * @returns HTML content as a string
 */
function getErrorContent(errorMessage: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Type Safety HUD</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          text-align: center;
          padding-top: 50px;
        }
        .error-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: var(--vscode-inputValidation-errorBackground);
          color: var(--vscode-inputValidation-errorForeground);
          border: 1px solid var(--vscode-inputValidation-errorBorder);
          border-radius: 4px;
          padding: 20px;
        }
        h1 {
          color: var(--vscode-errorForeground);
        }
      </style>
    </head>
    <body>
      <h1>Error Generating Dashboard</h1>
      <div class="error-container">
        <p>${errorMessage}</p>
      </div>
      <p>Please try again or check the logs for more information.</p>
    </body>
    </html>
  `;
}

/**
 * This method is called when the extension is deactivated
 */
export function deactivate() {
  console.log('Type Safety HUD extension is now deactivated!');
} 