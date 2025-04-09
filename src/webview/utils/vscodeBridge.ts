/**
 * Utility per comunicare con l'estensione VS Code
 */

// Interfaccia VS Code API
declare const vscode: {
  postMessage: (message: any) => void;
};

/**
 * Invia un messaggio al backend di VS Code
 * @param type Tipo di messaggio
 * @param payload Dati da inviare
 */
export function sendMessageToVSCode(type: string, payload?: any): void {
  vscode.postMessage({ type, payload });
}

/**
 * Carica le impostazioni dal backend
 */
export function loadSettings(): void {
  sendMessageToVSCode('settings.load');
}

/**
 * Salva le impostazioni nel backend
 * @param settings Impostazioni da salvare
 */
export function saveSettings(settings: any): void {
  sendMessageToVSCode('settings.save', settings);
}

/**
 * Salva il system prompt nel file indicato
 * @param content Contenuto del system prompt
 * @param filePath Percorso del file (opzionale)
 */
export function saveSystemPrompt(content: string, filePath?: string): void {
  sendMessageToVSCode('systemPrompt.save', { content, filePath });
}

/**
 * Apre il file del system prompt nell'editor
 * @param filePath Percorso del file (opzionale)
 */
export function openSystemPromptFile(filePath?: string): void {
  sendMessageToVSCode('systemPrompt.open', { filePath });
}

/**
 * Salva il context prompt nelle impostazioni
 * @param content Contenuto del context prompt
 */
export function saveContextPrompt(content: string): void {
  sendMessageToVSCode('contextPrompt.save', { content });
}

/**
 * Aggiunge un nuovo modello personalizzato
 * @param modelData Dati del modello da aggiungere
 */
export function addCustomModel(modelData: any): void {
  sendMessageToVSCode('model.add', modelData);
}

/**
 * Registra un listener per i messaggi provenienti dal backend
 * @param type Tipo di messaggio
 * @param callback Funzione da chiamare quando arriva un messaggio
 * @returns Funzione per rimuovere il listener
 */
export function registerMessageListener(
  type: string,
  callback: (payload: any) => void
): () => void {
  const handler = (event: MessageEvent) => {
    const message = event.data;
    if (message && message.type === type) {
      callback(message.payload);
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
} 