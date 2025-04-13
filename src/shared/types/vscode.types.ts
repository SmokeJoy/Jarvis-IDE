export interface VSCodeAPI {
  postMessage(message: any): void;
}

declare global {
  interface Window {
    vscode: VSCodeAPI;
  }
}

export interface VSCodeMessage {
  type: string;
  message?: string;
  command?: string;
  payload?: any;
}
