/**
 * Utility per l'integrazione con l'API del webview di VS Code
 */

// Dichiarazione del tipo per l'API di VS Code
declare global {
  interface Window {
    vscode: any;
    resourceBaseUrl: string;
    isDarkTheme: boolean;
  }
}

/**
 * Restituisce l'istanza dell'API VS Code
 */
export function getVsCodeApi() {
  if (typeof window.vscode !== 'undefined') {
    return window.vscode;
  }

  // Fallback per ambiente di sviluppo o test
  return {
    postMessage: (message: any) => {
      console.log('VS Code API mock: postMessage', message);
    },
    getState: () => ({}),
    setState: (state: any) => {
      console.log('VS Code API mock: setState', state);
    },
  };
}

/**
 * Restituisce l'URL base per le risorse
 */
export function getResourceBaseUrl(): string {
  return window.resourceBaseUrl || '';
}

/**
 * Verifica se il tema attuale è scuro
 */
export function isDarkTheme(): boolean {
  return window.isDarkTheme || false;
}

/**
 * Costruisce un URL completo per una risorsa relativa
 */
export function getResourceUrl(relativePath: string): string {
  const baseUrl = getResourceBaseUrl();
  return `${baseUrl}/${relativePath}`;
}
