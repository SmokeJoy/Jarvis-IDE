/**
 * Interfaccia per il messaggio da inviare al backend dell'estensione
 */
interface VSCodeMessage {
  type: string;
  command?: string;
  payload?: unknown;
}

/**
 * Interfaccia per lo stato del webview
 */
interface WebviewState {
  [key: string]: unknown;
}

/**
 * Utility wrapper per l'accesso all'API di VSCode
 */
export const vscode = {
  /**
   * Riferimento all'API di VS Code del webview
   */
  webviewApi: acquireVsCodeApi(),

  /**
   * Invia un messaggio all'estensione VS Code
   * @param message Il messaggio da inviare
   */
  postMessage(message: VSCodeMessage) {
    this.webviewApi.postMessage(message);
  },

  /**
   * Ottiene lo stato corrente salvato nel webview
   * @returns Lo stato corrente
   */
  getState(): WebviewState {
    return this.webviewApi.getState();
  },

  /**
   * Imposta un nuovo stato per il webview
   * @param state Il nuovo stato da impostare
   */
  setState(state: WebviewState) {
    this.webviewApi.setState(state);
  }
};

/**
 * Dichiara la funzione acquireVsCodeApi per TypeScript
 */
declare function acquireVsCodeApi(): {
  postMessage(message: VSCodeMessage): void;
  getState(): WebviewState;
  setState(state: WebviewState): void;
}; 