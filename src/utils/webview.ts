import { getVSCodeApi } from './vscode';
import type { UnifiedWebviewMessageUnion } from '@shared/types/messages-barrel';

export function postMessage<T extends UnifiedWebviewMessageUnion>(message: T): void {
  const vscode = getVSCodeApi();
  vscode.postMessage(message);
}
