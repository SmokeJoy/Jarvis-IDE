import type { OpenRouterModelInfo } from '../../types/extension.js.js';
import { ApiStream } from '../../types/global.js.js';
import { HistoryItem } from '../../shared/HistoryItem.js.js';
import { ApiProvider } from '../../agent/api/ApiProvider.js.js';

export interface ApiHandler {
  createMessage(
    systemPrompt: string,
    messages: HistoryItem[],
    options?: { signal?: AbortSignal }
  ): Promise<AsyncGenerator<ApiStream>>;
  
  getModel(): OpenRouterModelInfo;
}

// Rimuoviamo la vecchia definizione di ApiProvider che crea conflitti
// export interface ApiProvider {
//   provider: string;
//   apiKey?: string;
//   baseUrl?: string;
//   model?: string;
//   temperature?: number;
//   maxTokens?: number;
//   organization?: string;
// } 