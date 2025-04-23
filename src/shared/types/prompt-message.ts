import { z } from 'zod';
import type { PromptProfile } from './prompt';

export type ExtensionPromptMessage =
  | {
      type: 'promptProfiles';
      payload: { profiles: PromptProfile[] };
      error?: string;
    }
  | {
      type: 'profilesList';
      payload: { profiles: PromptProfile[] };
      error?: string;
    }
  | {
      type: 'promptProfileCreated';
      payload: { profile: PromptProfile };
      error?: string;
    }
  | {
      type: 'promptProfileSwitched';
      payload: { profile: PromptProfile; profiles?: PromptProfile[] };
      error?: string;
    }
  | {
      type: 'promptProfileUpdated';
      payload: { profile: PromptProfile; profiles?: PromptProfile[] };
      error?: string;
    }
  | {
      type: 'promptProfileDeleted';
      payload: { profile: PromptProfile; profiles?: PromptProfile[] };
      error?: string;
    }
  | {
      type: 'profileUpdated';
      payload: { profile: PromptProfile; profiles?: PromptProfile[] };
      error?: string;
    }
  | {
      type: 'switchPromptProfile';
      payload: { profileId: string };
      error?: string;
    }
  | {
      type: 'createPromptProfile';
      payload: { profile: Partial<PromptProfile> };
      error?: string;
    }
  | {
      type: 'updatePromptProfile';
      payload: { profileId: string; profile: Partial<PromptProfile> };
      error?: string;
    }
  | {
      type: 'deletePromptProfile';
      payload: { profileId: string };
      error?: string;
    }
  | {
      type: 'getPromptProfiles';
      payload?: Record<string, never>;
      error?: string;
    }
  | {
      type: 'saveSettings';
      payload: { contextPrompt: import('./webview.types').ContextPrompt };
      error?: string;
    }
  | {
      type: 'MAS_CONTEXT_PROMPT_SET';
      payload: { agentId: string; threadId: string; contextPrompt: string };
      error?: string;
    };

export function isExtensionPromptMessage(msg: unknown): msg is ExtensionPromptMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    [
      'promptProfiles',
      'profilesList',
      'promptProfileCreated',
      'promptProfileSwitched',
      'promptProfileUpdated',
      'promptProfileDeleted',
      'profileUpdated',
      'switchPromptProfile',
      'createPromptProfile',
      'updatePromptProfile',
      'deletePromptProfile',
      'getPromptProfiles',
      'saveSettings',
      'MAS_CONTEXT_PROMPT_SET',
    ].includes((msg as any).type)
  );
}