import { ChatMessage, ContentType, TextContent } from '../../types/chat.types.js';
import { logger } from '../../utils/logger.js';

interface LLMStudioMessageRole {
  role: string;
  content: string;
}

/**
 * Transformer per LLM Studio
 * Gestisce la conversione dei messaggi da/verso il formato LLM Studio API (compatibile OpenAI)
 */
export const LLMStudioTransformer = {
  /**
   * Converte i messaggi dal formato interno al formato LLM Studio
   */
  toLLMMessages(messages: ChatMessage[], systemPrompt?: string): LLMStudioMessageRole[] {
    const output: LLMStudioMessageRole[] = [];

    // Aggiungi system prompt se disponibile
    if (systemPrompt) {
      output.push({ role: 'system', content: systemPrompt });
    }

    // Converti tutti i messaggi nel formato LLM Studio
    for (const msg of messages) {
      if (!msg || !msg.role) continue;
      
      let role = msg.role;
      // Normalizza i ruoli secondo le aspettative di LLM Studio
      if (role === 'assistant' || role === 'user') {
        // Questi ruoli sono già supportati da LLM Studio
      } else if (role === 'system') {
        // System è supportato da LLM Studio
      } else {
        // Per altri ruoli, usa 'user' come fallback
        logger.warn(`[LLMStudioTransformer] Ruolo non supportato: ${role}, convertito in 'user'`);
        role = 'user';
      }

      // Gestione contenuto testuale o array
      let content: string;
      if (Array.isArray(msg.content)) {
        // Filtra solo i contenuti di testo
        const textParts = msg.content.filter(part => part.type === ContentType.Text);
        content = textParts.map(part => part.text).join('\n');
        
        // Log avviso se ci sono contenuti non testuali che vengono ignorati
        if (msg.content.length !== textParts.length) {
          logger.warn('[LLMStudioTransformer] Alcuni contenuti non testuali sono stati ignorati');
        }
      } else {
        content = String(msg.content);
      }

      output.push({ role, content });
    }

    return output;
  },

  /**
   * Converte la risposta LLM Studio nel formato interno ChatMessage
   */
  fromLLMResponse(response: any): ChatMessage {
    try {
      const choice = response.choices?.[0];
      if (!choice) {
        throw new Error('Risposta LLM Studio non valida: mancano le choices');
      }

      // Estrai il messaggio
      const message = choice.message;
      if (!message) {
        throw new Error('Risposta LLM Studio non valida: message mancante');
      }

      // Contenuto testuale
      const content: TextContent[] = [];
      
      if (typeof message.content === 'string') {
        content.push({
          type: ContentType.Text,
          text: message.content
        });
      }

      // Gestione delle function call se presenti
      if (message.function_call) {
        const functionCallContent = {
          type: ContentType.Text,
          text: `[FUNCTION_CALL: ${message.function_call.name}(${message.function_call.arguments})]`
        };
        content.push(functionCallContent as TextContent);
      }

      // Crea il messaggio nel formato interno
      return {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        providerFields: {
          model: response.model || 'lmstudio-model',
          stopReason: choice.finish_reason || 'unknown',
          usage: response.usage || {},
          internalReasoning: '[N/D: LLM Studio non fornisce reasoning]'
        }
      };
    } catch (err) {
      logger.error('[LLMStudioTransformer] Errore nella conversione della risposta', { err, response });
      throw err;
    }
  }
}; 