import { z } from 'zod';
/**
 * Utility per l'integrazione con l'API del webview di VS Code
 */
import type { VSCodeAPI } from 'vscode-webview';

/**
 * Restituisce l'istanza dell'API VS Code
 */
export function getVsCodeApi(): VSCodeAPI {
  if (typeof window.acquireVsCodeApi === 'function') {
    return window.acquireVsCodeApi();
  }

  console.warn('VS Code API not found, using mock.');
  return {
    postMessage: (message: any) => {
      console.log('VS Code API mock: postMessage', message);
    },
    getState: () => {
      console.log('VS Code API mock: getState');
      return undefined;
    },
    setState: (state: any) => {
      console.log('VS Code API mock: setState', state);
    },
  };
}

/**
 * Restituisce l'URL base per le risorse
 */
export function getResourceBaseUrl(): string {
  return (window as any).resourceBaseUrl || '';
}

/**
 * Verifica se il tema attuale è scuro
 */
export function isDarkTheme(): boolean {
  return (window as any).isDarkTheme || false;
}

/**
 * Costruisce un URL completo per una risorsa relativa
 */
export function getResourceUrl(relativePath: string): string {
  const baseUrl = getResourceBaseUrl();
  return `${baseUrl}/${relativePath}`;
}
