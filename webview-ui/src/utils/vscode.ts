import type { WebviewMessage } from "@/shared/types"
import type { ApiConfiguration } from "@/shared/types/api.types"
import type { WebviewApi } from "vscode-webview"

/**
 * A utility wrapper around the acquireVsCodeApi() function, which enables
 * message passing and state management between the webview and extension
 * contexts.
 *
 * This utility also enables webview code to be run in a web browser-based
 * dev server by using native web browser features that mock the functionality
 * enabled by acquireVsCodeApi.
 */

declare global {
	interface Window {
		acquireVsCodeApi: () => {
			postMessage: (message: WebviewMessage) => void;
			getState: () => any;
			setState: (state: any) => void;
		};
	}
}

/**
 * Interfaccia per l'API delle webview VS Code
 */
interface VSCodeAPI {
	postMessage(message: any): void;
	getState(): any;
	setState(state: any): void;
}

/**
 * Acquisisce l'API VS Code per la comunicazione con l'estensione
 * Si assicura che venga chiamata una sola volta per la durata della webview
 */
function getVSCodeAPI(): VSCodeAPI {
	// Assicuriamoci che l'API VSCode sia disponibile
	if (typeof acquireVsCodeApi === 'function') {
		// @ts-ignore - acquireVsCodeApi è una funzione globale iniettata dalla webview di VS Code
		return acquireVsCodeApi();
	}
	
	// Fallback per quando l'API non è disponibile (es. sviluppo locale)
	console.warn('VSCode API non disponibile, utilizzo implementazione fittizia');
	return {
		postMessage: (message: any) => {
			console.log('Messaggio (mock):', message);
		},
		getState: () => {
			return JSON.parse(localStorage.getItem('vscode-state') || '{}');
		},
		setState: (state: any) => {
			localStorage.setItem('vscode-state', JSON.stringify(state));
		}
	};
}

// Esporta una singola istanza dell'API VS Code
export const vscode = (window as any).vscode || getVSCodeAPI();
