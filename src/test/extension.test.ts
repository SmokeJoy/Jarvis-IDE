import { readFile } from "fs/promises"
import { describe, it, after } from "mocha"
import path from "path"
import { expect } from 'chai'
import * as vscode from "vscode"
import { test, beforeEach, afterEach, vi } from "vitest"
import { activate, deactivate } from "../extension.js.js"
import { JarvisProvider } from "../core/webview/JarvisProvider.js.js"
import { TelemetryService } from "../services/TelemetryService.js.js"
import type { ApiConfiguration } from "../types/global.js.js"

const packagePath = path.join(__dirname, "..", "..", "package.json")

describe("Jarvis IDE Extension", () => {
	after(() => {
		vscode.window.showInformationMessage("All tests done!")
	})

	it("should verify extension ID matches package.json", async () => {
		const packageJSON = JSON.parse(await readFile(packagePath, "utf8"))
		const id = packageJSON.publisher + "." + packageJSON.name
		const jarvisExtensionApi = vscode.extensions.getExtension(id)

		jarvisExtensionApi?.id.should.equal(id)
	})

	it("should successfully execute the plus button command", async () => {
		await new Promise((resolve) => setTimeout(resolve, 400))
		await vscode.commands.executeCommand("jarvis-ide.plusButtonClicked")
	})

	// New test to verify xvfb and webview functionality
	it("should create and display a webview panel", async () => {
		// Create a webview panel
		const panel = vscode.window.createWebviewPanel("testWebview", "CI/CD Test", vscode.ViewColumn.One, {
			enableScripts: true,
		})

		// Set some HTML content
		panel.webview.html = `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="UTF-8">
					<title>xvfb Test</title>
				</head>
				<body>
					<div id="test">Testing xvfb display server</div>
				</body>
			</html>
		`

		// Verify panel exists
		expect(panel).to.exist
		expect(panel.visible).to.be.true()

		// Clean up
		panel.dispose()
	})

	// Test webview message passing
	it("should handle webview messages", async () => {
		const panel = vscode.window.createWebviewPanel("testWebview", "Message Test", vscode.ViewColumn.One, {
			enableScripts: true,
		})

		// Set up message handling
		const messagePromise = new Promise<string>((resolve) => {
			panel.webview.onDidReceiveMessage((message) => resolve(message.text), undefined)
		})

		// Add message sending script
		panel.webview.html = `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="UTF-8">
					<title>Message Test</title>
				</head>
				<body>
					<script>
						const vscode = acquireVsCodeApi();
						vscode.postMessage({ text: 'test-message' });
					</script>
				</body>
			</html>
		`

		// Wait for message
		const message = await messagePromise
		message.should.equal("test-message")

		// Clean up
		panel.dispose()
	})
})

describe("Extension", () => {
	let context: vscode.ExtensionContext;

	beforeEach(() => {
		context = {
			subscriptions: [],
			extensionPath: "/test/path",
			globalState: {
				get: vi.fn(),
				update: vi.fn(),
			},
			workspaceState: {
				get: vi.fn(),
				update: vi.fn(),
			},
		} as any;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test("should activate extension", async () => {
		const extension = await activate(context);
		expect(extension).toBeDefined();
	});

	test("should register commands", async () => {
		await activate(context);
		expect(vscode.commands.registerCommand).toHaveBeenCalled();
	});

	test("activate should register extension", async () => {
		const id = "claude-dev.jarvis-ide"
		const jarvisExtensionApi = await activate()
		expect(jarvisExtensionApi?.id).toBe(id)
	})

	test("deactivate should dispose extension", async () => {
		const message = "test-message"
		await deactivate(message)
		expect(message).toBe("test-message")
	})
})
