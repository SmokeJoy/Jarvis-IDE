import { getVSCodeApi } from './vscode';

export function postMessage(message: unknown): void {
  const vscode = getVSCodeApi();
  vscode.postMessage(message);
}
