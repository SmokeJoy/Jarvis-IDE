/**
 * @file index.ts
 * @description Entry point per l'inizializzazione del WebviewDispatcher e altri servizi essenziali
 * @version 1.0.0
 */

import { initWebviewDispatcher } from './utils/WebviewDispatcher';

/**
 * Inizializza tutti i servizi principali della webview
 */
export function initializeWebviewServices(): void {
  console.info('Inizializzazione servizi webview...');
  
  // Inizializza il WebviewDispatcher per gestire i messaggi in arrivo
  initWebviewDispatcher();
  
  console.info('Servizi webview inizializzati con successo');
}

// Avvia l'inizializzazione dei servizi
initializeWebviewServices(); 