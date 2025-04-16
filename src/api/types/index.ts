import { OpenRouterModelInfo } from '../../types/extension';
import { ApiStream } from '../../src/shared/types/global';
import { HistoryItem } from '../../shared/HistoryItem';
import { ApiProvider } from '../../agent/api/ApiProvider';

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
