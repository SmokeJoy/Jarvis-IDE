/**
 * Mock degli helper di integrazione per i test
 */
import { WebviewMessage, ExtensionMessage } from './type-validation.mock';

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