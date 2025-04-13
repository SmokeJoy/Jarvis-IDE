/**
 * @file vscode-api.ts
 * @description Dichiarazione comune per l'API vscode nei componenti React
 */

import { VSCodeMessage } from '../webview-ui/vscode';

/**
 * Dichiarazione per l'API vscode WebView da usare nei componenti React
 */
declare global {
  const vscode: { 
    postMessage: (message: VSCodeMessage) => void 
  };
}

export {}; 