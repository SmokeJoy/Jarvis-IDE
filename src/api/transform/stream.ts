/**
 * Definizioni di tipi e utility per il flusso di risposte AI.
 */

import { logger } from '../../utils/logger';
import {
  ApiStream,
  ApiStreamChunk,
  ApiStreamTextChunk,
  ApiStreamReasoningChunk,
  ApiStreamUsageChunk,
} from '../../src/shared/types/api.types';

// Tipo di compatibilità per supportare codice legacy
export type ApiStreamOld = AsyncGenerator<ApiStreamChunk>;

// Riesporta i tipi per retrocompatibilità
export type {
  ApiStream,
  ApiStreamChunk,
  ApiStreamTextChunk,
  ApiStreamReasoningChunk,
  ApiStreamUsageChunk,
};

/**
 * Funzione per creare uno stream parser da una Response ReadableStream.
 * Legge ogni riga con prefisso `data:`, estrae e decodifica JSON, e lo emette via yield.
 *
 * @param stream Il ReadableStream da parsare
 * @returns Un ApiStream tipizzato che può essere iterato e cancellato
 */
export function createStreamParser<T = unknown>(stream: ReadableStream<Uint8Array>): ApiStream<T> {
  const decoder = new TextDecoder('utf-8');
  const reader = stream.getReader();

  let cancelled = false;
  let buffer = '';

  const iterator: AsyncIterable<T> = {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<T>> {
          while (!cancelled) {
            try {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');

              // Salviamo l'ultima riga incompleta per il prossimo chunk
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

                const raw = trimmedLine.replace(/^data:\s*/, '');
                if (raw === '[DONE]') return { done: true, value: undefined as unknown as T };

                try {
                  const json = JSON.parse(raw);
                  return { done: false, value: json };
                } catch (parseError) {
                  console.warn('[stream] Errore parsing JSON:', parseError);
                  continue; // ignoriamo e attendiamo il prossimo chunk valido
                }
              }
            } catch (err) {
              console.error('[stream] Errore lettura dallo stream:', err);
              break;
            }
          }
          return { done: true, value: undefined as unknown as T };
        },
      };
    },
  };

  // Funzione per annullare manualmente lo stream
  (iterator as ApiStream<T>).cancel = () => {
    cancelled = true;
    reader.cancel().catch(() => {}); // Ignoriamo eventuali errori di cancellazione
  };

  return iterator as ApiStream<T>;
}

/**
 * Crea un ApiStream dal risultato di una chiamata API che restituisce un ReadableStream.
 * Wrapper di utilità per creare stream dagli handler di API compatibili.
 *
 * @param response Risposta fetch o oggetto con ReadableStream
 * @returns Un ApiStream tipizzato che può essere iterato e cancellato
 */
export function createApiStream<T = ApiStreamChunk>(
  response: Response | { body: ReadableStream<Uint8Array> }
): ApiStream<T> {
  const stream = response.body;
  if (!stream) {
    throw new Error('[stream] Response non contiene un body leggibile');
  }
  return createStreamParser<T>(stream);
}

/**
 * Utility per creare uno stream simulato da una serie di eventi.
 * Utile per test o per wrappare risposte API non-streaming in formato streaming.
 *
 * @param chunks Array di chunk da emettere come stream
 * @param delayMs Ritardo tra i chunk in ms (default: 0)
 * @returns Un ApiStream che emette i chunk specificati
 */
export function createMockStream<T = ApiStreamChunk>(chunks: T[], delayMs = 0): ApiStream<T> {
  let cancelled = false;
  let index = 0;

  const iterator: AsyncIterable<T> = {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<T>> {
          if (cancelled || index >= chunks.length) {
            return { done: true, value: undefined as unknown as T };
          }

          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }

          return { done: false, value: chunks[index++] };
        },
      };
    },
  };

  // Funzione per annullare manualmente lo stream
  (iterator as ApiStream<T>).cancel = () => {
    cancelled = true;
  };

  return iterator as ApiStream<T>;
}

export class ApiStreamImpl implements ApiStream<ApiStreamChunk> {
  private chunks: ApiStreamChunk[] = [];
  private onChunk: (chunk: string) => void;
  private iterator: AsyncIterator<ApiStreamChunk> | null = null;

  constructor(onChunk: (chunk: string) => void) {
    this.onChunk = onChunk;
  }

  async *transform(iterator: AsyncIterator<string>) {
    try {
      while (true) {
        const { done, value } = await iterator.next();
        if (done) break;

        const chunk = JSON.parse(value) as ApiStreamChunk;
        this.chunks.push(chunk);
        this.onChunk(value);
        yield chunk;
      }
    } catch (error) {
      console.error('Error in stream transform:', error);
      throw error;
    }
  }

  getFullResponse(): string {
    return this.chunks
      .map((chunk) => {
        if (chunk.type === 'text') return chunk.text;
        if (chunk.type === 'reasoning') return chunk.reasoning;
        return '';
      })
      .join('');
  }

  [Symbol.asyncIterator]() {
    if (!this.iterator) {
      throw new Error('The iterator must be initialized before use');
    }
    return this;
  }

  async next() {
    if (!this.iterator) {
      throw new Error('The iterator must be initialized before use');
    }

    return this.iterator.next();
  }

  cancel() {
    // Implementazione vuota per compatibilità con l'interfaccia
    // Se necessario, aggiungere la logica di cancellazione
  }
}

// Esportiamo tutto ciò che è necessario
export default {
  ApiStreamImpl,
  createStreamParser,
  createApiStream,
  createMockStream,
} as const;
