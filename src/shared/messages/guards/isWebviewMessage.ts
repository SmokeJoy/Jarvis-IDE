import { z } from 'zod';
import type { WebviewMessage } from '../types';

const webviewMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown()
});

export function isWebviewMessage(value: unknown): value is WebviewMessage {
  return webviewMessageSchema.safeParse(value).success;
} 