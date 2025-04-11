// 📁 webview-ui/src/__integration__/integration-helpers.ts
import { WebviewMessage, ExtensionMessage } from '../../../src/shared/types/webview.types';

let sentMessages: WebviewMessage[] = [];

export function mockVSCodeAPI() {
  global.acquireVsCodeApi = () => ({
    postMessage: (msg: WebviewMessage) => {
      sentMessages.push(msg);
    }
  });
}

export function simulateExtensionMessage(msg: ExtensionMessage) {
  window.dispatchEvent(new MessageEvent('message', { data: msg }));
}

export function getLastSentMessage<T = WebviewMessage>(): T | undefined {
  return sentMessages[sentMessages.length - 1] as T;
}

export function resetIntegrationMocks() {
  sentMessages = [];
} 