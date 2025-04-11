import streamUtils from '../transform/stream.js'
import type { ApiStream, ApiStreamChunk } from '../transform/stream.js'
import { logger } from "../../utils/logger.mock.js"

/**
 * Interfaccia per la configurazione della cache
 */
export interface StreamCacheConfig {
  /**
   * Durata massima della cache in millisecondi
   */
  maxAge: number;
  
  /**
   * Numero massimo di elementi in cache
   */
  maxSize: number;
  
  /**
   * Funzione per generare una chiave univoca per la cache
   */
  keyGenerator: (prompt: string, messages: any[]) => string;
}

/**
 * Classe per la gestione della cache degli stream
 */
export class StreamCache {
  #cache: Map<string, { chunks: ApiStreamChunk[]; timestamp: number }> = new Map();
  #maxSize: number;
  #ttlMs: number;
  
  constructor(maxSize = 100, ttlMs = 3600000) {
    this.#maxSize = maxSize;
    this.#ttlMs = ttlMs;
  }
  
  /**
   * Ottiene uno stream dalla cache se disponibile e non scaduto
   */
  get(key: string, chunks: ApiStreamChunk[]): ApiStream<ApiStreamChunk> | null {
    const entry = this.#cache.get(key);
    if (!entry) {
      logger.debug(`[StreamCache] Cache miss for key: ${key}`);
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.#ttlMs) {
      logger.debug(`[StreamCache] Cache entry expired for key: ${key}`);
      this.#cache.delete(key);
      return null;
    }

    logger.debug(`[StreamCache] Cache hit for key: ${key}`);
    return this.createStreamFromChunks(entry.chunks);
  }
  
  /**
   * Memorizza uno stream nella cache
   */
  async set(key: string, chunks: ApiStreamChunk[]): Promise<void> {
    if (this.#cache.size >= this.#maxSize) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        logger.debug(`[StreamCache] Removing oldest entry: ${oldestKey}`);
        this.#cache.delete(oldestKey);
      }
    }

    logger.debug(`[StreamCache] Setting cache for key: ${key}`);
    this.#cache.set(key, { chunks, timestamp: Date.now() });
  }
  
  /**
   * Crea un nuovo stream a partire dai chunk memorizzati
   */
  private createStreamFromChunks(chunks: ApiStreamChunk[]): ApiStream<ApiStreamChunk> {
    return streamUtils.createMockStream(chunks);
  }
  
  private findOldestKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.#cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }
  
  /**
   * Pulisce la cache rimuovendo tutti gli elementi scaduti
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, value] of this.#cache.entries()) {
      if (now - value.timestamp > this.#ttlMs) {
        this.#cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      logger.debug(`[StreamCache] Pulita la cache, rimossi ${removedCount} elementi scaduti`);
    }
  }
  
  /**
   * Svuota completamente la cache
   */
  clear(): void {
    this.#cache.clear();
    logger.debug(`[StreamCache] Cache svuotata`);
  }
} 