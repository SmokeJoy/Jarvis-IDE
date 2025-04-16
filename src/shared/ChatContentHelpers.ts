/**
 * @file ChatContentHelpers.ts
 * @description Funzioni di supporto per normalizzare i contenuti di chat
 */

import { ContentBlock } from '../src/shared/types/chat.types';
import { ContentType } from '../src/shared/types/chat.types';

/**
 * Normalizza un blocco di contenuto
 * @param block Il blocco da normalizzare
 * @returns Il blocco in formato normalizzato
 */
export function normalizeContentBlock(block: ContentBlock): ContentBlock {
  if (!block) {
    return { type: ContentType.Text, text: '' };
  }

  // Se il blocco è già un ContentBlock, lo restituisce così com'è
  if (typeof block === 'object' && 'type' in block) {
    if (block.type === ContentType.Text) {
      return {
        type: ContentType.Text,
        text: block.text || '',
      };
    } else if (block.type === ContentType.Image) {
      return {
        type: ContentType.Image,
        url: block.url || '',
        media_type: block.media_type || 'image/png',
      };
    }
  }

  // Gestisci il caso in cui il blocco sia una stringa
  if (typeof block === 'string') {
    return {
      type: ContentType.Text,
      text: block,
    };
  }

  // Fallback: restituisci un blocco di testo vuoto
  return { type: ContentType.Text, text: '' };
}
