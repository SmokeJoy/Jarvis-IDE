/**
 * @file webviewBridge.ts
 * @description Funzioni di bridge per la comunicazione con la WebView
 * @version 1.0.0
 */

/**
 * Tipo per i messaggi inviati alla WebView
 */
export interface WebviewMessage {
  type: string;
  payload?: any;
}

/**
 * Mock dell'oggetto vscode usato per comunicare con la WebView
 * In produzione, questo viene sostituito dall'oggetto vscode reale
 */
const vscode = {
  postMessage: (message: any) => {
    // In ambiente di produzione, questa funzione invia il messaggio alla WebView
    // Nel contesto di test, viene sostituita da un mock
    console.log('Inviando messaggio alla WebView:', message);

    // Se la funzione viene eseguita in un browser, simula l'invio di un messaggio
    if (typeof window !== 'undefined') {
      window.postMessage(message, '*');
    }
  },
};

/**
 * Invia un messaggio alla WebView
 * @param message Il messaggio da inviare
 */
export function sendToUI(message: WebviewMessage): void {
  try {
    vscode.postMessage(message);
  } catch (error) {
    console.error("Errore nell'invio del messaggio alla WebView:", error);
  }
}
