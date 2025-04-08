import { describe, it } from 'mocha';
import { strict as assert } from 'assert';
import { StreamCache } from './StreamCache.js';
import streamUtils from '../transform/stream.js';
import type { ApiStream, ApiStreamChunk } from '../transform/stream.js';

describe('StreamCache', () => {
  function createTestStream(chunks: ApiStreamChunk[]): ApiStream<ApiStreamChunk> {
    const apiStream = new streamUtils.ApiStreamImpl(() => {});
    const iterator = (async function* () {
      for (const chunk of chunks) {
        yield JSON.stringify(chunk);
      }
    })();
    apiStream.transform(iterator);
    return apiStream;
  }

  it('dovrebbe memorizzare e recuperare uno stream dalla cache', async () => {
    // Configurazione della cache
    const config = {
      maxAge: 1000, // 1 secondo
      maxSize: 10,
      keyGenerator: (prompt: string, _messages: any[]) => `${prompt}-${_messages.length}`
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo uno stream di test
    const chunks: ApiStreamChunk[] = [
      { type: 'text', text: 'Ciao' },
      { type: 'text', text: 'Mondo' }
    ];
    const testStream = createTestStream(chunks);
    
    // Memorizziamo lo stream nella cache
    await cache.set('test prompt', [{ role: 'user', content: 'test' }], testStream);
    
    // Recuperiamo lo stream dalla cache
    const cachedStream = cache.get('test prompt', [{ role: 'user', content: 'test' }]);
    
    // Verifichiamo che lo stream sia stato recuperato correttamente
    assert.notStrictEqual(cachedStream, null);
    
    // Verifichiamo il contenuto dello stream
    const receivedChunks: ApiStreamChunk[] = [];
    if (cachedStream) {
      for await (const chunk of cachedStream) {
        receivedChunks.push(chunk as ApiStreamChunk);
      }
    }
    
    assert.strictEqual(receivedChunks.length, 2);
    assert.deepStrictEqual(receivedChunks[0], { type: 'text', text: 'Ciao' });
    assert.deepStrictEqual(receivedChunks[1], { type: 'text', text: 'Mondo' });
  });
  
  it('dovrebbe gestire correttamente la scadenza della cache', async () => {
    // Configurazione della cache con età massima molto breve
    const config = {
      maxAge: 100, // 100 ms
      maxSize: 10,
      keyGenerator: (prompt: string, _messages: any[]) => `${prompt}-${_messages.length}`
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo uno stream di test
    const chunks: ApiStreamChunk[] = [
      { type: 'text', text: 'Ciao' }
    ];
    const testStream = createTestStream(chunks);
    
    // Memorizziamo lo stream nella cache
    await cache.set('test prompt', [{ role: 'user', content: 'test' }], testStream);
    
    // Attendiamo che la cache scada
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Recuperiamo lo stream dalla cache
    const cachedStream = cache.get('test prompt', [{ role: 'user', content: 'test' }]);
    
    // Verifichiamo che lo stream non sia più nella cache
    assert.strictEqual(cachedStream, null);
  });
  
  it('dovrebbe gestire correttamente il limite di dimensione della cache', async () => {
    // Configurazione della cache con dimensione massima di 2
    const config = {
      maxAge: 1000,
      maxSize: 2,
      keyGenerator: (prompt: string, _messages: any[]) => prompt
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo tre stream di test
    const stream1 = createTestStream([{ type: 'text', text: 'Stream 1' }]);
    const stream2 = createTestStream([{ type: 'text', text: 'Stream 2' }]);
    const stream3 = createTestStream([{ type: 'text', text: 'Stream 3' }]);
    
    // Memorizziamo i tre stream nella cache
    await cache.set('prompt1', [], stream1);
    await cache.set('prompt2', [], stream2);
    await cache.set('prompt3', [], stream3);
    
    // Verifichiamo che il primo stream sia stato rimosso
    const cachedStream1 = cache.get('prompt1', []);
    assert.strictEqual(cachedStream1, null);
    
    // Verifichiamo che gli altri due stream siano ancora nella cache
    const cachedStream2 = cache.get('prompt2', []);
    const cachedStream3 = cache.get('prompt3', []);
    
    assert.notStrictEqual(cachedStream2, null);
    assert.notStrictEqual(cachedStream3, null);
  });
  
  it('dovrebbe pulire correttamente la cache', async () => {
    // Configurazione della cache
    const config = {
      maxAge: 100, // 100 ms
      maxSize: 10,
      keyGenerator: (prompt: string, _messages: any[]) => prompt
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo due stream di test
    const stream1 = createTestStream([{ type: 'text', text: 'Stream 1' }]);
    const stream2 = createTestStream([{ type: 'text', text: 'Stream 2' }]);
    
    // Memorizziamo i due stream nella cache
    await cache.set('prompt1', [], stream1);
    
    // Attendiamo un po' per il primo stream
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Memorizziamo il secondo stream
    await cache.set('prompt2', [], stream2);
    
    // Attendiamo che il primo stream scada
    await new Promise(resolve => setTimeout(resolve, 60));
    
    // Puliamo la cache
    cache.cleanup();
    
    // Verifichiamo che il primo stream sia stato rimosso
    const cachedStream1 = cache.get('prompt1', []);
    assert.strictEqual(cachedStream1, null);
    
    // Verifichiamo che il secondo stream sia ancora nella cache
    const cachedStream2 = cache.get('prompt2', []);
    assert.notStrictEqual(cachedStream2, null);
  });
  
  it('dovrebbe svuotare correttamente la cache', async () => {
    // Configurazione della cache
    const config = {
      maxAge: 1000,
      maxSize: 10,
      keyGenerator: (prompt: string, _messages: any[]) => prompt
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo due stream di test
    const stream1 = createTestStream([{ type: 'text', text: 'Stream 1' }]);
    const stream2 = createTestStream([{ type: 'text', text: 'Stream 2' }]);
    
    // Memorizziamo i due stream nella cache
    await cache.set('prompt1', [], stream1);
    await cache.set('prompt2', [], stream2);
    
    // Svuotiamo la cache
    cache.clear();
    
    // Verifichiamo che entrambi gli stream siano stati rimossi
    const cachedStream1 = cache.get('prompt1', []);
    const cachedStream2 = cache.get('prompt2', []);
    
    assert.strictEqual(cachedStream1, null);
    assert.strictEqual(cachedStream2, null);
  });
  
  it('dovrebbe recuperare uno stream dalla cache entro un tempo limite', async () => {
    // Configurazione della cache
    const config = {
      maxAge: 1000,
      maxSize: 10,
      keyGenerator: (prompt: string, _messages: any[]) => `${prompt}-${_messages.length}`
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo uno stream di test
    const chunks: ApiStreamChunk[] = [
      { type: 'text', text: 'Ciao' },
      { type: 'text', text: 'Mondo' }
    ];
    const testStream = createTestStream(chunks);
    
    // Memorizziamo lo stream nella cache
    await cache.set('test prompt', [{ role: 'user', content: 'test' }], testStream);
    
    // Misuriamo il tempo di recupero
    const startTime = Date.now();
    const cachedStream = cache.get('test prompt', [{ role: 'user', content: 'test' }]);
    const endTime = Date.now();
    
    // Verifichiamo che il recupero sia avvenuto entro 50ms
    assert.ok(endTime - startTime < 50, 'Il recupero dalla cache ha impiegato troppo tempo');
    
    // Verifichiamo che lo stream sia stato recuperato correttamente
    assert.notStrictEqual(cachedStream, null);
    
    // Verifichiamo il contenuto dello stream
    const receivedChunks: ApiStreamChunk[] = [];
    if (cachedStream) {
      for await (const chunk of cachedStream) {
        receivedChunks.push(chunk as ApiStreamChunk);
      }
    }
    
    assert.strictEqual(receivedChunks.length, 2);
    assert.deepStrictEqual(receivedChunks[0], { type: 'text', text: 'Ciao' });
    assert.deepStrictEqual(receivedChunks[1], { type: 'text', text: 'Mondo' });
  });
  
  it('dovrebbe gestire correttamente un carico elevato di stream', async () => {
    // Configurazione della cache con dimensione massima di 50
    const config = {
      maxAge: 1000,
      maxSize: 50,
      keyGenerator: (prompt: string, _messages: any[]) => prompt
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo 100 stream di test
    const streams: ApiStreamChunk[][] = Array(100).fill(null).map((_, i) => [
      { type: 'text', text: `Stream ${i}` }
    ]);
    
    // Memorizziamo tutti gli stream nella cache
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      await cache.set(`prompt${i}`, [], createTestStream(streams[i]));
    }
    const endTime = Date.now();
    
    // Verifichiamo che l'inserimento di 100 stream sia avvenuto entro 1 secondo
    assert.ok(endTime - startTime < 1000, 'L\'inserimento di 100 stream ha impiegato troppo tempo');
    
    // Verifichiamo che solo gli ultimi 50 stream siano nella cache (maxSize = 50)
    for (let i = 0; i < 50; i++) {
      const cachedStream = cache.get(`prompt${i}`, []);
      assert.strictEqual(cachedStream, null, `Lo stream ${i} non dovrebbe essere nella cache`);
    }
    
    for (let i = 50; i < 100; i++) {
      const cachedStream = cache.get(`prompt${i}`, []);
      assert.notStrictEqual(cachedStream, null, `Lo stream ${i} dovrebbe essere nella cache`);
      
      if (cachedStream) {
        // Verifichiamo il contenuto dello stream
        const receivedChunks: ApiStreamChunk[] = [];
        for await (const chunk of cachedStream) {
          receivedChunks.push(chunk as ApiStreamChunk);
        }
        
        assert.strictEqual(receivedChunks.length, 1);
        assert.deepStrictEqual(receivedChunks[0], { type: 'text', text: `Stream ${i}` });
      }
    }
  });
  
  it('dovrebbe gestire correttamente gli errori durante la memorizzazione', async () => {
    // Configurazione della cache
    const config = {
      maxAge: 1000,
      maxSize: 10,
      keyGenerator: (prompt: string, _messages: any[]) => prompt
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo uno stream che genera un errore durante l'iterazione
    const errorStream = new streamUtils.ApiStreamImpl(() => {});
    const iterator = (async function* () {
      yield JSON.stringify({ type: 'text', text: 'Primo chunk' });
      throw new Error('Errore simulato durante l\'iterazione dello stream');
    })();
    errorStream.transform(iterator);
    
    // Memorizziamo lo stream nella cache
    try {
      await cache.set('error prompt', [], errorStream);
      assert.fail('Dovrebbe lanciare un errore');
    } catch (error) {
      if (error instanceof Error) {
        assert.strictEqual(error.message, 'Errore simulato durante l\'iterazione dello stream');
      }
    }
    
    // Verifichiamo che lo stream non sia stato memorizzato nella cache
    const cachedStream = cache.get('error prompt', []);
    assert.strictEqual(cachedStream, null);
  });
  
  it('dovrebbe gestire correttamente le operazioni concorrenti', async () => {
    // Configurazione della cache
    const config = {
      maxAge: 1000,
      maxSize: 10,
      keyGenerator: (prompt: string, _messages: any[]) => prompt
    };
    
    const cache = new StreamCache(config);
    
    // Creiamo 10 stream di test
    const streams: ApiStreamChunk[][] = Array(10).fill(null).map((_, i) => [
      { type: 'text', text: `Stream ${i}` }
    ]);
    
    // Eseguiamo operazioni concorrenti di memorizzazione e recupero
    const operations: Promise<void>[] = [];
    
    // 10 operazioni di memorizzazione concorrenti
    for (let i = 0; i < 10; i++) {
      operations.push(cache.set(`prompt${i}`, [], createTestStream(streams[i])));
    }
    
    // Attendiamo che tutte le operazioni di memorizzazione siano completate
    await Promise.all(operations);
    
    // 10 operazioni di recupero concorrenti
    const retrievals: Promise<ApiStreamChunk[]>[] = [];
    for (let i = 0; i < 10; i++) {
      retrievals.push((async () => {
        const stream = cache.get(`prompt${i}`, []);
        if (stream) {
          const chunks: ApiStreamChunk[] = [];
          for await (const chunk of stream) {
            chunks.push(chunk as ApiStreamChunk);
          }
          return chunks;
        }
        return [];
      })());
    }
    
    // Attendiamo che tutte le operazioni di recupero siano completate
    const results = await Promise.all(retrievals);
    
    // Verifichiamo che tutti gli stream siano stati recuperati correttamente
    for (let i = 0; i < 10; i++) {
      assert.strictEqual(results[i].length, 1, `Lo stream ${i} non ha il numero corretto di chunk`);
      assert.deepStrictEqual(results[i][0], { type: 'text', text: `Stream ${i}` }, `Lo stream ${i} non ha il contenuto corretto`);
    }
  });
}); 