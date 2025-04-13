import { ChatMessage, ContentType, TextContent, ImageContent } from '../../types/chat.types';
import { logger } from '../../utils/logger';
import { createSafeMessage } from "../../shared/types/message";

/**
 * Tipo rappresentante un messaggio nel formato Ollama
 */
interface OllamaMessage {
  role: string;
  content: string;
  images?: string[];
}

/**
 * Transformer per Ollama
 * Gestisce la conversione dei messaggi da/verso il formato Ollama API
 */
export const OllamaTransformer = {
  /**
   * Converte i messaggi dal formato interno al formato Ollama
   */
  toLLMMessages(messages: ChatMessage[], systemPrompt?: string): OllamaMessage[] {
    const output: OllamaMessage[] = [];

    // Converti tutti i messaggi nel formato Ollama
    for (const msg of messages) {
      if (!msg || !msg.role) continue;

      let role = msg.role;
      // Normalizza i ruoli secondo le aspettative di Ollama
      if (role === 'assistant' || role === 'user') {
        // Questi ruoli sono già supportati da Ollama
      } else if (role === 'system') {
        // Ollama gestisce il system prompt separatamente, non come messaggio
        continue;
      } else {
        // Per altri ruoli, usa 'user' come fallback
        logger.warn(`[OllamaTransformer] Ruolo non supportato: ${role}, convertito in 'user'`);
        role = 'user';
      }

      // Gestione contenuto testuale o array
      if (Array.isArray(msg.content)) {
        // Separazione di contenuti testuali e immagini
        const textParts: string[] = [];
        const images: string[] = [];

        for (const part of msg.content) {
          if (part.type === ContentType.Text) {
            textParts.push(part.text);
          } else if (part.type === ContentType.Image) {
            // Per Ollama, le immagini sono base64 senza il prefisso 'data:image/...'
            const imageContent = part as ImageContent;
            if (imageContent.url) {
              // Se è un URL, possiamo usarlo direttamente
              images.push(imageContent.url);
            } else if (imageContent.base64Data) {
              // Se è base64, rimuoviamo l'intestazione se presente
              const base64Data = imageContent.base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
              images.push(base64Data);
            }
          }
        }

        // Creiamo il messaggio Ollama
        const ollamaMsg: OllamaMessage = {
          role,
          content: textParts.join('\n'),
        };

        // Aggiungiamo le immagini se presenti
        if (images.length > 0) {
          ollamaMsg.images = images;
        }

        output.push(ollamaMsg);
      } else {
        // Se il contenuto è una stringa semplice
        output.push({
          role,
          content: String(msg.content),
        });
      }
    }

    return output;
  },

  /**
   * Converte la risposta Ollama nel formato interno ChatMessage
   */
  fromLLMResponse(response: any, model?: string): ChatMessage {
    try {
      // Estrai il messaggio dalla risposta di Ollama
      const message = response.message;
      if (!message) {
        throw new Error('Risposta Ollama non valida: message mancante');
      }

      // Contenuto testuale
      const content: TextContent[] = [];

      if (typeof message.content === 'string') {
        content.push({
          type: ContentType.Text,
          text: message.content,
        });
      }

      // Crea il messaggio nel formato interno
      return {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        providerFields: {
          model: model || 'ollama-model',
          stopReason: response.done ? 'stop' : 'unknown',
          usage: {
            promptTokens: response.prompt_eval_count || 0,
            completionTokens: response.eval_count || 0,
            totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
          },
          internalReasoning: '[N/D: Ollama non fornisce reasoning]',
        },
      };
    } catch (err) {
      logger.error('[OllamaTransformer] Errore nella conversione della risposta', {
        err,
        response,
      });
      throw err;
    }
  },
};

/**
 * Utilità per gestire immagini in Ollama
 */
export function processOllamaImages(messages: ChatMessage[]): OllamaMessage[] {
  return messages.map((message) => {
    // Verifica se il contenuto contiene URL di immagini
    const imageUrls: string[] = [];
    const textContent = message.content
      .replace(/!\[.*?\]\((.*?)\)/g, (match, url) => {
        imageUrls.push(url);
        return '';
      })
      .trim();

    return createSafeMessage({role: message.role, content: textContent});
  });
}
