/**
 * @file index.ts
 * @description File indice per l'esportazione dei tipi e delle funzioni di protocollo WebView
 */

// Esporta tutti i tipi dal file di protocollo
export * from './webview.protocol.js.js';

// Esporta la funzione di validazione
export { validateWebviewMessage } from './validateWebviewMessage.test.js.js';

// Esporta la funzione di conversione
export { convertToWebviewMessage } from './convertToWebviewMessage.js.js'; 