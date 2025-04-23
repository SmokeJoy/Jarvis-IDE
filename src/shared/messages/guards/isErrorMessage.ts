import { z } from 'zod';
import type { ErrorMessage } from '../types';

const errorMessageSchema = z.object({
  type: z.literal('error'),
  payload: z.object({
    message: z.string(),
    details: z.unknown().optional()
  })
});

export function isErrorMessage(message: unknown): message is ErrorMessage {
  return errorMessageSchema.safeParse(message).success;
} 