/**
 * Utility per la comunicazione con l'estensione VSCode.
 * Fornisce un'interfaccia per inviare messaggi alla WebView.
 */

// Acquisisce il riferimento all'API VSCode
const vscode = acquireVsCodeApi();

/**
 * Invia un messaggio all'estensione VSCode e restituisce una promessa
 * che si risolve quando viene ricevuta una risposta corrispondente.
 * 
 * @param message Il messaggio da inviare
 * @param timeout Timeout in millisecondi dopo il quale la promessa viene rifiutata
 * @returns Una promessa che si risolve con la risposta
 */
const postMessageWithResponse = (message: any, timeout = 5000): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Genera un ID univoco per questa richiesta
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageWithId = { ...message, requestId };
    
    // Setup del listener per la risposta
    const messageListener = (event: MessageEvent) => {
      const response = event.data;
      
      // Verifica che la risposta corrisponda alla richiesta
      if (response.requestId === requestId) {
        // Rimuovi il listener quando la risposta è stata ricevuta
        window.removeEventListener('message', messageListener);
        
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      }
    };
    
    // Aggiungi il listener
    window.addEventListener('message', messageListener);
    
    // Invia il messaggio
    vscode.postMessage(messageWithId);
    
    // Setup del timeout
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      reject(new Error(`Timeout superato di ${timeout}ms per la richiesta ${requestId}`));
    }, timeout);
  });
};

export { vscode, postMessageWithResponse }; 