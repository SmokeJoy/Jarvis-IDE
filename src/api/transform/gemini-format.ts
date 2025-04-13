import {
  Content,
  EnhancedGenerateContentResponse,
  InlineDataPart,
  Part,
  TextPart,
} from '@google/generative-ai';
import { logger } from '../../utils/logger';
import {
  ChatMessage,
  ContentBlock,
  TextBlock,
  ImageBlock,
  ContentType,
  isTextBlock,
  isImageBlock,
} from '../../types/chat.types';
import {
  AnthropicMessage,
  AnthropicContentBlock,
  AnthropicMessageResponse,
  AnthropicTextBlock,
  AnthropicImageBlock,
} from '../../types/provider-types/anthropic-types';

/**
 * Converte il contenuto dal formato interno al formato Gemini
 */
export function convertContentToGemini(content: string | ContentBlock[]): Part[] {
  if (typeof content === 'string') {
    return [{ text: content } as TextPart];
  }
  return content.flatMap((block) => {
    if (isTextBlock(block)) {
      return { text: block.text } as TextPart;
    } else if (isImageBlock(block)) {
      if (block.base64Data) {
        return {
          inlineData: {
            data: block.base64Data,
            mimeType: block.media_type,
          },
        } as InlineDataPart;
      } else if (block.url) {
        throw new Error('URL image source type not supported by Gemini');
      } else {
        throw new Error('Unsupported image source type');
      }
    }
    logger.warn(`Unsupported content block type: ${block.type}`);
    return { text: '[Contenuto non supportato]' } as TextPart;
  });
}

/**
 * Converte un messaggio dal formato interno a Gemini
 */
export function convertMessageToGemini(message: ChatMessage): Content {
  return {
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: convertContentToGemini(message.content),
  };
}

/**
 * Converte un messaggio dal formato Anthropic a Gemini
 * @deprecated Utilizzare convertMessageToGemini invece
 */
export function convertAnthropicMessageToGemini(message: AnthropicMessage): Content {
  if (typeof message.content === 'string') {
    return {
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    };
  }

  // Mappa i blocchi di contenuto Anthropic in parti Gemini
  const parts = message.content.flatMap((block) => {
    if (block.type === 'text') {
      return { text: (block as AnthropicTextBlock).text };
    } else if (block.type === 'image') {
      const imageBlock = block as AnthropicContentBlock & { type: 'image' };
      if (imageBlock.source.type === 'base64') {
        return {
          inlineData: {
            data: imageBlock.source.data || '',
            mimeType: imageBlock.source.media_type || 'image/jpeg',
          },
        };
      }
      // Gemini non supporta URL, ignoriamo le immagini URL
    }
    return [];
  });

  return {
    role: message.role === 'assistant' ? 'model' : 'user',
    parts,
  };
}

/*
Gemini tende a fare doppio escape di alcuni caratteri nei contenuti dei file: 
https://discuss.ai.google.dev/t/function-call-string-property-is-double-escaped/37867
*/
export function unescapeGeminiContent(content: string) {
  return content
    .replace(/\\n/g, '\n')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

/**
 * Converte una risposta Gemini nel formato interno
 */
export function convertGeminiResponseToInternal(
  response: EnhancedGenerateContentResponse
): AnthropicMessageResponse {
  const content: AnthropicContentBlock[] = [];

  // Aggiungi la risposta testuale principale
  const text = response.text();
  if (text) {
    content.push({
      type: 'text',
      text,
    } as AnthropicTextBlock);
  }

  // Determina la ragione di stop
  let stop_reason: string | null = null;
  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason) {
    switch (finishReason) {
      case 'STOP':
        stop_reason = 'end_turn';
        break;
      case 'MAX_TOKENS':
        stop_reason = 'max_tokens';
        break;
      case 'SAFETY':
      case 'RECITATION':
      case 'OTHER':
        stop_reason = 'stop_sequence';
        break;
      // Aggiungi altri casi se necessario
    }
  }

  return {
    id: `msg_${Date.now()}`, // Genera un ID univoco
    type: 'message',
    role: 'assistant',
    content,
    model: '',
    stop_reason,
    stop_sequence: null, // Gemini non fornisce questa informazione
    usage: {
      input_tokens: response.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

/**
 * Transformer per convertire tra il formato ChatMessage standard e il formato Gemini
 */
export const GeminiTransformer = {
  /**
   * Converte messaggi dal formato standard al formato Gemini
   */
  toLLMMessages(messages: ChatMessage[], systemPrompt?: string): any[] {
    const output: any[] = [];

    if (systemPrompt) {
      output.push({ role: 'user', parts: [{ text: systemPrompt }] });
    }

    for (const msg of messages) {
      let parts: Part[] = [];

      // Gestisci contenuto stringa o array di ContentBlock
      if (typeof msg.content === 'string') {
        parts = [{ text: msg.content }];
      } else if (Array.isArray(msg.content)) {
        parts = msg.content.flatMap((block) => {
          if (isTextBlock(block)) {
            return { text: block.text };
          } else if (isImageBlock(block)) {
            if (block.base64Data) {
              return {
                inlineData: {
                  data: block.base64Data,
                  mimeType: block.media_type || 'image/jpeg',
                },
              };
            }
            // Gemini non supporta URL, quindi qui ignoriamo le URL
          }
          return [];
        });
      }

      // Converti il ruolo per Gemini (assistant → model)
      const role = msg.role === 'assistant' ? 'model' : msg.role;
      output.push({ role, parts });
    }

    return output;
  },

  /**
   * Converte una risposta Gemini nel formato standard
   */
  fromLLMResponse(response: any): ChatMessage {
    const candidates = response?.candidates?.[0];
    const parts = candidates?.content?.parts || [];

    const content: ContentBlock[] = parts.map(
      (p) =>
        ({
          type: ContentType.Text,
          text: p.text || '[Contenuto vuoto]',
        }) as TextBlock
    );

    return {
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      providerFields: {
        model: response.model || 'gemini',
        stopReason: candidates?.finishReason || 'unknown',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
          totalTokens:
            (response.usageMetadata?.promptTokenCount || 0) +
            (response.usageMetadata?.candidatesTokenCount || 0),
        },
        internalReasoning: '[N/D: Gemini non fornisce reasoning]',
      },
    };
  },
};
