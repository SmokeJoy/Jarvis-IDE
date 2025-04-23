import { z } from 'zod';
import type { ExtensionMessage } from '../types';
import type { ExtensionPromptMessage } from '../extension-messages';

const extensionMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown()
});

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  return extensionMessageSchema.safeParse(value).success;
}

export function isExtensionPromptMessage(msg: unknown): msg is ExtensionPromptMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg;
} 