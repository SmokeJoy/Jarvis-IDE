import type { JarvisSettings } from './settings.types.js.js';
import type { ChatMessage } from './chat.types.js.js';
import type { AIProvider } from '../shared/types/provider.types.js.js';

export interface ExtensionState {
  settings: JarvisSettings;
  chatHistory: ChatMessage[];
  activeProvider: AIProvider;
  isInitialized: boolean;
  lastError?: string;
}

export interface ExtensionMessage {
  type: 'settings' | 'chat' | 'error' | 'status';
  payload: unknown;
}

export interface ExtensionCommand {
  id: string;
  name: string;
  description: string;
  handler: () => Promise<void>;
}