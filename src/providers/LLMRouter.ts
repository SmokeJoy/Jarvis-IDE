/**
 * Router centrale per i provider LLM
 * Permette di ottenere un'istanza di provider configurata in base al nome
 */

import type { PromptPayload, LLMResponse, LLMStreamToken } from '@shared/types/llm.types';
import { getProvider, registerProvider, listProviders } from './provider-registry';

export const LLMRouter = {
  sendPrompt(payload: PromptPayload): Promise<LLMResponse> {
    const { providerId } = payload;
    const provider = getProvider(providerId);
    return provider.sendPrompt(payload);
  },
  async streamPrompt(payload: PromptPayload, onToken: (token: LLMStreamToken) => void): Promise<void> {
    const { providerId } = payload;
    const provider = getProvider(providerId);
    return provider.streamPrompt(payload, onToken);
  },
  cancel(requestId: string): void {
    for (const id of listProviders()) {
      getProvider(id).cancel(requestId);
    }
  },
  registerProvider,
  listProviders,
};
