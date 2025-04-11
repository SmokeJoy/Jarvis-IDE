import { JarvisSettings } from './settings.types.js';
import { ChatMessage } from './chat.types.js';
import { AIProvider } from '../shared/types/provider.types.js';

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