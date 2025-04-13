import { JarvisSettings } from './settings.types';
import { ChatMessage } from './chat.types';
import { AIProvider } from '../shared/types/provider.types';

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
