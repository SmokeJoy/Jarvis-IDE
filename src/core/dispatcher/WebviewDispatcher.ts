import { WebviewMessageUnion } from '@shared/messages';

type Handler<T> = (message: T) => void;

const handlers: Partial<{
  [K in WebviewMessageUnion['type']]: Handler<Extract<WebviewMessageUnion, { type: K }>>
}> = {};

export function registerHandler<T extends WebviewMessageUnion['type']>(
  type: T,
  handler: Handler<Extract<WebviewMessageUnion, { type: T }>>
) {
  handlers[type] = handler;
}

export function handleIncomingMessage(message: WebviewMessageUnion) {
  const handler = handlers[message.type] as Handler<typeof message> | undefined;
  if (handler) {
    handler(message);
  } else {
    console.warn('No handler for message type:', message.type);
  }
} 