import { ApiProvider, StreamHandler } from '../ApiProvider.js';
import { ChatMessage } from '../../../types/ChatMessage.js';
import { GeminiTransformer } from '../../../api/transform/gemini-format.js';
import { logger } from '../../../utils/logger.js';

/**
 * Provider per Google Gemini API
 */
export class GeminiProvider implements ApiProvider {
  /**
   * Chat standard (non streaming)
   */
  async chat(
    messages: ChatMessage[],
    apiKey: string,
    baseUrl?: string,
    systemPrompt?: string
  ): Promise<ChatMessage> {
    const url = baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;
    const geminiMessages = GeminiTransformer.toLLMMessages(messages, systemPrompt);

    const body = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    logger.debug('[GeminiProvider] Invio richiesta chat', { url });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Errore Gemini API: ${res.status} - ${err}`);
      }

      const data = await res.json();
      logger.debug('[GeminiProvider] Risposta ricevuta', { data });

      return GeminiTransformer.fromLLMResponse(data);
    } catch (err) {
      logger.error('[GeminiProvider] Errore durante la chat', { err });
      throw err;
    }
  }

  /**
   * Streaming (solo se Gemini supporterà streaming API in futuro)
   */
  async streamChat(
    messages: ChatMessage[],
    apiKey: string,
    baseUrl: string,
    handler: StreamHandler,
    systemPrompt?: string
  ): Promise<void> {
    logger.warn('[GeminiProvider] Streaming non supportato attualmente, uso fallback');
    const message = await this.chat(messages, apiKey, baseUrl, systemPrompt);
    if (Array.isArray(message.content)) {
      message.content.forEach(part => {
        if (part.type === 'text') handler.onToken?.(part.text);
      });
    } else {
      handler.onToken?.(message.content.toString());
    }
    handler.onComplete?.();
  }
} 