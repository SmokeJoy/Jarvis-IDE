/**
 * @file index.ts
 * @description File indice per l'esportazione dei tipi e delle funzioni di protocollo WebView
 */

// Esporta tutti i tipi dal file di protocollo
export * from './webview.protocol';

// Esporta la funzione di validazione
export { validateWebviewMessage } from './validateWebviewMessage.test';

// Esporta la funzione di conversione
export { convertToWebviewMessage } from './convertToWebviewMessage';
