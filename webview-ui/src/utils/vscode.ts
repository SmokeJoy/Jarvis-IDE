/**
 * @file vscode.ts
 * @description Utility per interagire con l'API acquireVsCodeApi di VS Code
 */

import { Logger } from './Logger';

// Definizione del tipo per l'API VS Code
type VsCodeAPI = {
	postMessage: (message: unknown) => void;
	getState: () => unknown;
	setState: (state: unknown) => void;
};

/**
 * Ottiene l'API VS Code, assicurandosi che acquireVsCodeApi() venga chiamata solo una volta
 * Come richiesto dalla documentazione di VS Code API
 * @returns L'istanza dell'API VS Code
 */
const getVSCodeAPI = (): VsCodeAPI => {
	const logger = new Logger('vscode');
	
	// Utilizziamo un approccio cache per garantire che acquireVsCodeApi() 
	// venga chiamata solo una volta durante il ciclo di vita della WebView
	try {
		if (!(window as any).__vscodeApiCache) {
			logger.debug('Inizializzazione API VS Code');
			
			// Verifica che siamo in un contesto VS Code
			if (typeof acquireVsCodeApi === 'undefined') {
				throw new Error('acquireVsCodeApi non disponibile: non siamo in un contesto VS Code');
			}
			
			// Ottieni l'API VS Code e memorizzala nella cache
			(window as any).__vscodeApiCache = acquireVsCodeApi();
		}
		
		return (window as any).__vscodeApiCache as VsCodeAPI;
	} catch (error) {
		logger.error('Errore durante l\'acquisizione dell\'API VS Code:', error);
		
		// Fallback: se siamo in un contesto di sviluppo, fornisci una mock implementation
		if (process.env.NODE_ENV === 'development') {
			logger.warn('Utilizzando mock API VS Code per ambiente di sviluppo');
			return {
				postMessage: (message: unknown) => {
					console.log('[Mock VS Code API] postMessage:', message);
				},
				getState: () => {
					console.log('[Mock VS Code API] getState chiamato');
					return {};
				},
				setState: (state: unknown) => {
					console.log('[Mock VS Code API] setState:', state);
				},
			};
		}
		
		// Se non siamo in modalità sviluppo, lancia un errore
		throw new Error('Impossibile inizializzare l\'API VS Code e non è disponibile un fallback');
	}
};

// Esporta l'istanza dell'API VS Code
export const vscode = getVSCodeAPI();
