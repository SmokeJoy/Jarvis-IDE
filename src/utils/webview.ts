import { getVSCodeApi } from './vscode.js.js'

export function postMessage(message: unknown): void {
  const vscode = getVSCodeApi()
  vscode.postMessage(message)
} 