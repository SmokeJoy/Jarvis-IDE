import * as vscode from "vscode"

export class SidebarProvider implements vscode.WebviewViewProvider {
	constructor(private readonly extensionUri: vscode.Uri) {}

	resolveWebviewView(
		webviewView: vscode.WebviewView
	): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		webviewView.webview.html = this.getHtmlForWebview()
	}

	getHtmlForWebview(): string {
		return `<html><body><h1>Sidebar Placeholder</h1></body></html>`
	}
} 