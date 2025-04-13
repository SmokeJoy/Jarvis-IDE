import { ChatMessage, ContentType, TextContent } from '../../types/chat.types';
import { logger } from '../../utils/logger';
import { createSafeMessage } from "../../shared/types/message";

interface MistralMessageRole {
  role: string;
  content: string;
}

/**
 * Transformer per Mistral AI
 * Gestisce la conversione dei messaggi da/verso il formato Mistral API
 */
export const MistralTransformer = {
  /**
   * Converte i messaggi dal formato interno al formato Mistral
   */
  toLLMMessages(messages: ChatMessage[], systemPrompt?: string): MistralMessageRole[] {
    const output: MistralMessageRole[] = [];

    // Aggiungi system prompt se disponibile
    if (systemPrompt) {
      output.push(createSafeMessage({role: 'system', content: systemPrompt}));
    }

    // Converti tutti i messaggi nel formato Mistral
    for (const msg of messages) {
      if (!msg || !msg.role) continue;

      let role = msg.role;
      // Normalizza i ruoli secondo le aspettative di Mistral
      if (role === 'assistant' || role === 'user') {
        // Questi ruoli sono già supportati da Mistral
      } else if (role === 'system') {
        // System è supportato da Mistral
      } else {
        // Per altri ruoli, usa 'user' come fallback
        logger.warn(`[MistralTransformer] Ruolo non supportato: ${role}, convertito in 'user'`);
        role = 'user';
      }

      // Gestione contenuto testuale o array
      let content: string;
      if (Array.isArray(msg.content)) {
        // Filtra solo i contenuti di testo
        const textParts = msg.content.filter((part) => part.type === ContentType.Text);
        content = textParts.map((part) => part.text).join('\n');

        // Log avviso se ci sono contenuti non testuali che vengono ignorati
        if (msg.content.length !== textParts.length) {
          logger.warn('[MistralTransformer] Alcuni contenuti non testuali sono stati ignorati');
        }
      } else {
        content = String(msg.content);
      }

      output.push({ role, content });
    }

    return output;
  },

  /**
   * Converte la risposta Mistral nel formato interno ChatMessage
   */
  fromLLMResponse(response: any): ChatMessage {
    try {
      const choice = response.choices?.[0];
      if (!choice) {
        throw new Error('Risposta Mistral non valida: mancano le choices');
      }

      // Estrai il messaggio
      const message = choice.message;
      if (!message) {
        throw new Error('Risposta Mistral non valida: message mancante');
      }

      // Contenuto testuale
      const content: TextContent[] = [];

      if (typeof message.content === 'string') {
        content.push({
          type: ContentType.Text,
          text: message.content,
        });
      }

      // Gestione dei tool calls se presenti
      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.type === 'function') {
            const toolUseContent = {
              type: ContentType.Text,
              text: `[TOOL_USE: ${JSON.stringify({
                id: toolCall.id,
                type: 'function',
                function: {
                  name: toolCall.function.name,
                  arguments: toolCall.function.arguments,
                },
              })}]`,
            };
            content.push(toolUseContent as TextContent);
          }
        }
      }

      // Crea il messaggio nel formato interno
      return {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        providerFields: {
          model: response.model || 'mistral',
          stopReason: choice.finish_reason || 'unknown',
          usage: response.usage || {},
          internalReasoning: message.tool_reasoning || '[N/D: Mistral non fornisce reasoning]',
        },
      };
    } catch (err) {
      logger.error('[MistralTransformer] Errore nella conversione della risposta', {
        err,
        response,
      });
      throw err;
    }
  },
};
