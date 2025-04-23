import { WebviewMessageUnion } from '@shared/messages';

type Handler<T> = (message: T) => void;

type MessageOfType<T extends WebviewMessageUnion['type']> = Extract<WebviewMessageUnion, { type: T }>;

const handlers: Partial<{
  [K in WebviewMessageUnion['type']]: Handler<Extract<WebviewMessageUnion, { type: K }>>
}> = {};

export function registerHandler<T extends WebviewMessageUnion['type']>(
  type: T,
  handler: Handler<Extract<WebviewMessageUnion, { type: T }>>
) {
  handlers[type] = handler;
}

export function handleIncomingMessage<T extends WebviewMessageUnion['type']>(
  msg: MessageOfType<T>
): void {
  const handler = handlers[msg.type] as Handler<MessageOfType<T>> | undefined;
  handler?.(msg);
} 