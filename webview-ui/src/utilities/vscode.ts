/**
 * Utility per la comunicazione con VS Code
 */

/**
 * Interfaccia per l'API di VS Code per il WebView
 */
interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

/**
 * Ottiene l'API di VS Code, garantendo che venga chiamata solo una volta
 */
function getVSCodeAPI(): VSCodeAPI {
  // @ts-ignore
  return acquireVsCodeApi();
}

// Acquisisce e memorizza l'API VS Code per utilizzo futuro
let _vscode: VSCodeAPI;
try {
  _vscode = getVSCodeAPI();
} catch (error) {
  // Fallback per l'uso al di fuori di VS Code (ad es. durante lo sviluppo)
  _vscode = {
    postMessage: (message: any) => {
      console.log('VS Code API non disponibile. Messaggio:', message);
    },
    getState: () => {
      console.log('VS Code API non disponibile. getState() chiamata');
      return {};
    },
    setState: (state: any) => {
      console.log('VS Code API non disponibile. setState() chiamata con:', state);
    }
  };
}

export const vscode = _vscode; 