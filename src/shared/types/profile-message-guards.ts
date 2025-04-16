import { ProfileUpdatedMessage, ProfilesListMessage } from './profile-message';

export function isProfileUpdatedMessage(msg: unknown): msg is ProfileUpdatedMessage {
  return typeof msg === 'object' && msg !== null && 
         'type' in msg && (msg as any).type === 'profileUpdated' &&
         'payload' in msg && typeof (msg as any).payload === 'object' &&
         (msg as any).payload !== null && 'profile' in (msg as any).payload;
}

export function isProfilesListMessage(msg: unknown): msg is ProfilesListMessage {
  return typeof msg === 'object' && msg !== null &&
         'type' in msg && (msg as any).type === 'profilesList' &&
         'payload' in msg && typeof (msg as any).payload === 'object' &&
         (msg as any).payload !== null && 'profiles' in (msg as any).payload;
}