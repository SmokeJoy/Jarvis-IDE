import { WebviewMessage } from './message';

export interface Profile {
  id: string;
  contextPrompt: Record<string, string>;
  isDefault: boolean;
}

export interface ProfileUpdatedMessage extends WebviewMessage<'profileUpdated'> {
  payload: {
    profile: Profile;
  };
}

export interface ProfilesListMessage extends WebviewMessage<'profilesList'> {
  payload: {
    profiles: Profile[];
  };
}