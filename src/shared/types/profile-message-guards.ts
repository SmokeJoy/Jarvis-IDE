import { z } from 'zod';
import { ProfileUpdatedMessage, ProfilesListMessage } from './profile-message';

export function isProfileUpdatedMessage(msg: unknown): msg is ProfileUpdatedMessage {
  return typeof msg === 'object' && msg !== null && 
         'type' in msg && (msg as any).type === 'profileUpdated' &&
         'payload' in msg && typeof (msg.payload as unknown) === 'object' &&
         (msg.payload as unknown) !== null && 'profile' in (msg.payload as unknown);
}

export function isProfilesListMessage(msg: unknown): msg is ProfilesListMessage {
  return typeof msg === 'object' && msg !== null &&
         'type' in msg && (msg as any).type === 'profilesList' &&
         'payload' in msg && typeof (msg.payload as unknown) === 'object' &&
         (msg.payload as unknown) !== null && 'profiles' in (msg.payload as unknown);
}