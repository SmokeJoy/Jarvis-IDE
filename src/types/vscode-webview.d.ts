declare module 'vscode-webview' {
  export interface VSCodeAPI {
    postMessage(message: any): void;
    getState<T>(): T | undefined;
    setState<T>(state: T): void;
  }

  export interface Webview {
    postMessage(message: any): Thenable<boolean>;
    asWebviewUri(localResource: any): any;
    cspSource: string;
    onDidReceiveMessage(callback: (message: any) => void): void;
  }

  export interface WebviewApi<T = any> {
    postMessage(message: T): void;
    getState(): T | undefined;
    setState(state: T): void;
  }

  export function acquireVsCodeApi(): VSCodeAPI;

  export interface WebviewPanel {
    webview: Webview;
  }

  export interface ExtensionContext {
    extensionUri: any;
    extension: {
      packageJSON: {
        version: string;
      };
    };
  }

  export interface Window {
    activeColorTheme: {
      kind: number;
    };
    onDidChangeActiveColorTheme(callback: () => void): void;
  }

  declare global {
    interface Window {
      acquireVsCodeApi(): VSCodeAPI;
    }
  }
}
