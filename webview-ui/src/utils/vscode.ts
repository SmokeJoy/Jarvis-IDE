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

/**
 * Gestione dell'API VS Code dal webview.
 */

// Mantengo la funzione getVsCodeApi che fornisce il fallback
let api: ReturnType<typeof window.acquireVsCodeApi> | null = null;

export function getVsCodeApi<StateType = any>() {
	if (!api) {
		if (typeof window.acquireVsCodeApi === 'function') {
			api = window.acquireVsCodeApi();
		} else {
			// Fallback se acquireVsCodeApi non è disponibile (es. test)
			console.warn('acquireVsCodeApi not found, using fallback mock.');
			api = {
				postMessage: (message: any) => console.log('[Mock] postMessage:', message),
				getState: () => {
					console.log('[Mock] getState');
					return undefined as StateType | undefined; // Mantengo il tipo generico
				},
				setState: (state: StateType) => {
					console.log('[Mock] setState:', state);
				},
			};
		}
	}
	return api;
}

// Esporta una singola istanza dell'API VS Code
export const vscode = (window as any).vscode || getVsCodeApi();
