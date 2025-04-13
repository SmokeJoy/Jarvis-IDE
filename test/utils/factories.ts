// test/utils/factories.ts
import { createSafeMessage } from '../../src/shared/types/message-adapter';
import { ChatMessage } from '../../src/shared/types/message.types';

export function mockMessage(
  role: 'user' | 'assistant' | 'system' = 'user',
  content: string = '',
  options?: Partial<ChatMessage>
): ChatMessage {
  return createSafeMessage(role, content, {
    timestamp: Date.now(),
    ...options,
  });
} 