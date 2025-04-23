import { z } from 'zod';
import type { ApiMessageUnion, ApiMessageType } from '../types';

const apiMessageSchema = z.object({
  type: z.nativeEnum(ApiMessageType),
  payload: z.unknown()
});

export function isApiMessage(message: unknown): message is ApiMessageUnion {
  return apiMessageSchema.safeParse(message).success;
}

export function isApiMessageOfType<T extends ApiMessageType>(
  message: unknown,
  type: T
): message is Extract<ApiMessageUnion, { type: T }> {
  return isApiMessage(message) && message.type === type;
} 