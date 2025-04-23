import { z } from 'zod';
import type { ExtensionPromptMessage, PromptProfile } from '../types';

const promptProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  isDefault: z.boolean().optional()
});

const promptProfilesPayloadSchema = z.object({
  profiles: z.array(promptProfileSchema)
});

const promptProfileUpdatedPayloadSchema = z.object({
  profile: promptProfileSchema
});

export function isPromptProfilesMessage(
  msg: unknown
): msg is ExtensionPromptMessage & { type: 'promptProfiles' } {
  if (!isExtensionMessage(msg) || msg.type !== 'promptProfiles') {
    return false;
  }
  return promptProfilesPayloadSchema.safeParse((msg.payload as unknown)).success;
}

export function isPromptProfileUpdatedMessage(
  msg: unknown
): msg is ExtensionPromptMessage & { type: 'promptProfileUpdated' } {
  if (!isExtensionMessage(msg) || msg.type !== 'promptProfileUpdated') {
    return false;
  }
  return promptProfileUpdatedPayloadSchema.safeParse((msg.payload as unknown)).success;
}

function isExtensionMessage(msg: unknown): msg is { type: string; payload: unknown } {
  return typeof msg === 'object' && msg !== null && 'type' in msg && 'payload' in msg;
} 