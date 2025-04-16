import { ChatMessage } from './types/message';
import { ApiConfiguration } from '../src/shared/types/api.types';
import { AutoApprovalSettings, BrowserSettings, ChatSettings } from './types/user-settings.types';
import { ChatCompletionContentPartText, ChatCompletionContentPartImage } from '../src/shared/types/api.types';

// Definisco l'interfaccia con i tipi corretti importati dal file centralizzato
export interface HistoryItem {
  id: string;
  task: string;
  timestamp: number;
  apiConfiguration: ApiConfiguration;
  autoApprovalSettings: AutoApprovalSettings;
  browserSettings: BrowserSettings;
  chatSettings: ChatSettings;
  customInstructions?: string;
  tokensIn?: number;
  tokensOut?: number;
  role?: 'user' | 'assistant';
  content?: (ChatCompletionContentPartText | ChatCompletionContentPartImage)[];
}
