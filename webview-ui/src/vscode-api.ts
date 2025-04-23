/**
 * @file vscode-api.ts
 * @description Bridge per l'API di VS Code nella WebView
 * @version 1.0.0
 */

// Definisce l'interfaccia per acquireVsCodeApi()
declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

// Ottiene l'API di VS Code in modo da preservare l'istanza unica
// L'API deve essere acquisita solo una volta per evitare errori
let vscodeApi: ReturnType<typeof acquireVsCodeApi> | undefined;

try {
  // Solo a runtime dentro VS Code si può accedere a questa API
  if (typeof acquireVsCodeApi === 'function') {
    vscodeApi = acquireVsCodeApi();
  }
} catch (error) {
  console.error('Failed to acquire VS Code API', error);
  // Implementazione fittizia per test e sviluppo
  vscodeApi = {
    postMessage: (message: unknown) => {
      console.log('VS Code API postMessage mock:', message);
    },
    getState: () => null,
    setState: () => {}
  };
}

// Esporta l'API di VS Code
export const vscode = vscodeApi!; 