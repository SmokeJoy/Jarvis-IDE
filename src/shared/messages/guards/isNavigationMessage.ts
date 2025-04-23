import { z } from 'zod';
import type { NavigationMessage } from '../types';

const navigationMessageSchema = z.object({
  type: z.literal('navigate'),
  payload: z.object({
    route: z.string(),
    params: z.record(z.string()).optional()
  })
});

export function isNavigationMessage(message: unknown): message is NavigationMessage {
  return navigationMessageSchema.safeParse(message).success;
} 