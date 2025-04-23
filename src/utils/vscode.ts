import type { WebviewApi } from 'vscode-webview';

declare const acquireVsCodeApi: () => {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

let vscode: ReturnType<typeof acquireVsCodeApi>;

try {
  vscode = acquireVsCodeApi();
} catch (error) {
  // Mock per l'ambiente di test
  vscode = {
    postMessage: () => {},
    getState: () => ({}),
    setState: () => {},
  };
}

export const postMessage = (type: string, value: any) => {
  vscode.postMessage({ type, value });
};

export const getState = () => vscode.getState();

export const setState = (state: any) => vscode.setState(state);

export function getVSCodeApi(): WebviewApi<Record<string, unknown>> {
    return acquireVsCodeApi();
}

export default vscode;
