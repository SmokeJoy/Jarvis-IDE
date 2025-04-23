import { z } from 'zod';
import type { StateMessage } from '../types';

const stateMessageSchema = z.object({
  type: z.literal('state'),
  payload: z.record(z.unknown())
});

export function isStateMessage(message: unknown): message is StateMessage {
  return stateMessageSchema.safeParse(message).success;
} 