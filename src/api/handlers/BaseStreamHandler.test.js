import { strict as assert } from 'assert';
import { describe, it } from 'mocha';

// Import del modulo retryAsync 
import { retryAsync } from '../retry.js';

// Classe mock che estende BaseStreamHandler per i test
class MockBaseHandler {
  constructor() {
    this.options = {};
    this.attempts = 0;
    this.cancelled = false;
    
    // Simula il comportamento di fetchAPIResponse
    this.fetchAPIResponse = async (prompt, messages) => {
      this.attempts++;
      
      // Alla prima chiamata lanciamo un errore per testare il retry
      if (this.attempts === 1) {
        throw new Error('Test error to trigger retry');
      }
      
      return { data: 'mock response' };
    };
    
    // Simula il comportamento di convertToStream
    this.convertToStream = (response) => {
      return {
        [Symbol.asyncIterator]: async function* () {
          yield { text: 'Ciao', type: 'greeting' };
          yield { text: 'Come stai?', type: 'question' };
        }
      };
    };
    
    // Implementazione simulata di getStream
    this.getStream = async (prompt, messages) => {
      const response = await retryAsync(() => this.fetchAPIResponse(prompt, messages));
      return this.convertToStream(response);
    };
    
    // Implementazione simulata di transformToApiStream
    this.transformToApiStream = async function* (iterator, transformer) {
      try {
        for await (const chunk of iterator) {
          if (this.cancelled) {
            break;
          }
          const transformedChunks = transformer(chunk);
          for (const transformedChunk of transformedChunks) {
            yield transformedChunk;
          }
        }
      } catch (error) {
        console.error('Errore durante la trasformazione dello stream:', error);
        throw error;
      }
    };
    
    // Implementa createMessage che usa getStream e transformToApiStream
    this.createMessage = async function* (prompt, messages) {
      const rawStream = await this.getStream(prompt, messages);
      
      const apiStream = this.transformToApiStream(rawStream, (chunk) => {
        // Trasformiamo il chunk usando la funzione fornita
        if (chunk.type === 'greeting') {
          return [{ type: 'text', text: `Saluto: ${chunk.text}` }];
        } else if (chunk.type === 'question') {
          return [{ type: 'text', text: `Domanda: ${chunk.text}` }];
        }
        return [];
      });
      
      yield* apiStream;
    };
    
    this.getModel = () => ({ id: 'test-model', info: {} });
    
    // Metodo per simulare la cancellazione dello stream
    this.cancelStream = () => {
      this.cancelled = true;
    };
  }
}

describe('BaseStreamHandler', () => {
  it('dovrebbe gestire i retry quando fetchAPIResponse fallisce', async () => {
    const handler = new MockBaseHandler();
    const prompt = 'test prompt';
    const messages = [{ role: 'user', content: prompt }];
    
    // Chiamiamo getStream che dovrebbe fare retry quando fetchAPIResponse fallisce
    const stream = await handler.getStream(prompt, messages);
    
    // Verifichiamo che ci siano stati 2 tentativi (1 fallito + 1 riuscito)
    assert.strictEqual(handler.attempts, 2);
    
    // Verifichiamo che lo stream sia stato convertito correttamente
    let chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    assert.strictEqual(chunks.length, 2);
    assert.deepStrictEqual(chunks[0], { text: 'Ciao', type: 'greeting' });
    assert.deepStrictEqual(chunks[1], { text: 'Come stai?', type: 'question' });
  });
  
  it('dovrebbe trasformare lo stream usando transformToApiStream', async () => {
    const handler = new MockBaseHandler();
    const prompt = 'test prompt';
    const messages = [{ role: 'user', content: prompt }];
    
    let result = '';
    
    // Chiamiamo createMessage che usa transformToApiStream
    for await (const chunk of handler.createMessage(prompt, messages)) {
      if (chunk.type === 'text') {
        result += chunk.text + ' ';
      }
    }
    
    // Verifichiamo che il testo sia stato trasformato correttamente
    assert.strictEqual(result.trim(), 'Saluto: Ciao Domanda: Come stai?');
  });
  
  it('dovrebbe gestire la cancellazione dello stream', async () => {
    const handler = new MockBaseHandler();
    const prompt = 'test prompt';
    const messages = [{ role: 'user', content: prompt }];
    
    let result = '';
    let chunkCount = 0;
    
    // Chiamiamo createMessage e cancelliamo dopo il primo chunk
    for await (const chunk of handler.createMessage(prompt, messages)) {
      if (chunk.type === 'text') {
        result += chunk.text + ' ';
      }
      chunkCount++;
      
      // Cancelliamo dopo il primo chunk
      if (chunkCount === 1) {
        handler.cancelStream();
      }
    }
    
    // Verifichiamo che solo il primo chunk sia stato processato
    assert.strictEqual(result.trim(), 'Saluto: Ciao');
    assert.strictEqual(chunkCount, 1);
  });
  
  it('dovrebbe gestire errori durante la trasformazione dello stream', async () => {
    const handler = new MockBaseHandler();
    const prompt = 'test prompt';
    const messages = [{ role: 'user', content: prompt }];
    
    // Modifichiamo temporaneamente il metodo transformToApiStream per simulare un errore
    const originalTransformToApiStream = handler.transformToApiStream;
    handler.transformToApiStream = async function* (iterator, transformer) {
      throw new Error('Errore di trasformazione simulato');
    };
    
    // Verifichiamo che l'errore venga propagato correttamente
    try {
      for await (const chunk of handler.createMessage(prompt, messages)) {
        // Questo non dovrebbe mai essere eseguito
      }
      assert.fail('Dovrebbe lanciare un errore');
    } catch (error) {
      assert.strictEqual(error.message, 'Errore di trasformazione simulato');
    } finally {
      // Ripristiniamo il metodo originale
      handler.transformToApiStream = originalTransformToApiStream;
    }
  });
  
  it('dovrebbe gestire correttamente i messaggi vuoti', async () => {
    const handler = new MockBaseHandler();
    const prompt = '';
    const messages = [];
    
    // Modifichiamo temporaneamente il metodo convertToStream per restituire uno stream vuoto
    const originalConvertToStream = handler.convertToStream;
    handler.convertToStream = () => {
      return {
        [Symbol.asyncIterator]: async function* () {
          // Stream vuoto
        }
      };
    };
    
    let chunkCount = 0;
    for await (const chunk of handler.createMessage(prompt, messages)) {
      chunkCount++;
    }
    
    // Verifichiamo che non ci siano chunk
    assert.strictEqual(chunkCount, 0);
    
    // Ripristiniamo il metodo originale
    handler.convertToStream = originalConvertToStream;
  });
  
  it('dovrebbe gestire correttamente i messaggi lunghi', async () => {
    const handler = new MockBaseHandler();
    const prompt = 'a'.repeat(1000); // Messaggio lungo
    const messages = [{ role: 'user', content: prompt }];
    
    // Modifichiamo temporaneamente il metodo convertToStream per restituire molti chunk
    const originalConvertToStream = handler.convertToStream;
    handler.convertToStream = () => {
      return {
        [Symbol.asyncIterator]: async function* () {
          for (let i = 0; i < 100; i++) {
            yield { text: `Chunk ${i}`, type: 'text' };
          }
        }
      };
    };
    
    let chunkCount = 0;
    for await (const chunk of handler.createMessage(prompt, messages)) {
      chunkCount++;
    }
    
    // Verifichiamo che tutti i chunk siano stati processati
    assert.strictEqual(chunkCount, 100);
    
    // Ripristiniamo il metodo originale
    handler.convertToStream = originalConvertToStream;
  });
}); 