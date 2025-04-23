import type { WebviewMessageUnion } from '@shared/messages';

export function postMessage<T extends WebviewMessageUnion>(message: T): void {
  window.parent?.postMessage(message, '*');
} 