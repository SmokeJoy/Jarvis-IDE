declare global {
  interface Window {
    vscode: {
      postMessage: <T = any>(message: T) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

export interface VSCodeWebview {
  postMessage: <T = any>(message: T) => void;
  getState: () => any;
  setState: (state: any) => void;
}

export interface VSCodeAPI {
  postMessage: <T = any>(message: T) => void;
  getState: () => any;
  setState: (state: any) => void;
}

export interface WebviewMessage {
  type: string;
  [key: string]: any;
}

export interface WebviewErrorMessage extends WebviewMessage {
  type: 'error';
  message: string;
}

export interface WebviewStateMessage extends WebviewMessage {
  type: 'state';
  state: any;
}

export type { VSCodeWebview as default };
