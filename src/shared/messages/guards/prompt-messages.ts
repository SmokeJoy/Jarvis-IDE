import { z } from 'zod';
import { isObject } from '../../utils/type-guards';
import type { ExtensionPromptMessage, PromptProfile } from '../contextPrompt.types';

/**
 * Verifica se un messaggio è un messaggio promptProfiles valido
 */
export function isPromptProfilesMessage(msg: unknown): msg is ExtensionPromptMessage & { type: 'promptProfiles' } {
  return isObject(msg) && (msg as any).type === 'promptProfiles';
}

/**
 * Verifica se un oggetto è un PromptProfile valido
 */
export function isPromptProfile(obj: unknown): obj is PromptProfile {
  return isObject(obj) &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).contextPrompt === 'object';
}

/**
 * Verifica se un payload contiene un array di PromptProfile validi
 */
export function isPromptProfilePayload(payload: unknown): payload is { profiles: PromptProfile[] } {
  return isObject(payload) &&
    Array.isArray((payload as any).profiles) &&
    (payload as any).profiles.every(isPromptProfile);
} 
 