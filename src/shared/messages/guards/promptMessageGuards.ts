import { z } from 'zod';
import { isObject } from '../../utils/type-utils';
import { 
  type ExtensionPromptMessage, 
  type PromptProfile, 
  type ContextPrompt,
  ExtensionMessageType 
} from '@shared/messages';
import { isExtensionPromptMessage } from './extensionMessageGuards';

/**
 * Type guard per il messaggio promptProfiles
 */
export function isPromptProfilesMessage(
  msg: unknown
): msg is ExtensionPromptMessage & {
  type: ExtensionMessageType.PROMPT_PROFILES;
  payload: { profiles: PromptProfile[] };
} {
  return (
    isExtensionPromptMessage(msg) &&
    msg.type === ExtensionMessageType.PROMPT_PROFILES &&
    isPromptProfilesPayload((msg.payload as unknown))
  );
}

/**
 * Type guard per il payload dei profili
 */
export function isPromptProfilesPayload(
  payload: unknown
): payload is { profiles: PromptProfile[] } {
  return (
    isObject(payload) &&
    Array.isArray((payload as any).profiles) &&
    (payload as any).profiles.every(isPromptProfile)
  );
}

/**
 * Type guard per un singolo PromptProfile
 */
export function isPromptProfile(val: unknown): val is PromptProfile {
  return (
    isObject(val) &&
    typeof (val as any).id === 'string' &&
    typeof (val as any).name === 'string' &&
    typeof (val as any).description === 'string' &&
    typeof (val as any).isDefault === 'boolean' &&
    isContextPrompt((val as any).contextPrompt) &&
    typeof (val as any).createdAt === 'number' &&
    typeof (val as any).updatedAt === 'number'
  );
}

/**
 * Type guard per ContextPrompt
 */
export function isContextPrompt(val: unknown): val is ContextPrompt {
  return (
    isObject(val) &&
    typeof (val as any).system === 'string' &&
    typeof (val as any).user === 'string' &&
    typeof (val as any).persona === 'string' &&
    typeof (val as any).context === 'string'
  );
}

/**
 * Type guard per il messaggio promptProfileUpdated
 */
export function isPromptProfileUpdatedMessage(
  msg: unknown
): msg is ExtensionPromptMessage & {
  type: ExtensionMessageType.PROMPT_PROFILE_UPDATED;
  payload: { profile: PromptProfile };
} {
  return (
    isExtensionPromptMessage(msg) &&
    msg.type === ExtensionMessageType.PROMPT_PROFILE_UPDATED &&
    isObject((msg.payload as unknown)) &&
    isPromptProfile(((msg.payload as unknown) as any).profile)
  );
} 
 