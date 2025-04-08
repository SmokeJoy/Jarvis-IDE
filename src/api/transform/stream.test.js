/**
 * Test per il modulo stream.ts
 */
const assert = require('node:assert');
const { createStreamParser, createApiStream, createMockStream } = require('./stream');

// Utility per creare un ReadableStream simulato
function createMockReadableStream(chunks) {
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    }
  });
}

describe('ApiStream', function() {
  describe('createStreamParser', function() {
    it('should correctly parse data lines from stream', async function() {
      // Simuliamo un flusso di dati con formato "data: {JSON}"
      const mockStream = createMockReadableStream([
        'data: {"type":"text","text":"Hello"}\n',
        'data: {"type":"text","text":" World"}\n',
        'data: [DONE]\n'
      ]);
      
      const stream = createStreamParser(mockStream);
      const results = [];
      
      for await (const chunk of stream) {
        results.push(chunk);
      }
      
      assert.strictEqual(results.length, 2);
      assert.deepStrictEqual(results[0], { type: 'text', text: 'Hello' });
      assert.deepStrictEqual(results[1], { type: 'text', text: ' World' });
    });
    
    it('should handle incomplete chunks and buffer them correctly', async function() {
      // Simuliamo un flusso di dati frammentato
      const mockStream = createMockReadableStream([
        'data: {"type":"t',
        'ext","text":"Fragment',
        'ed"}\n',
        'data: {"type":"text","text":"Complete"}\n'
      ]);
      
      const stream = createStreamParser(mockStream);
      const results = [];
      
      for await (const chunk of stream) {
        results.push(chunk);
      }
      
      assert.strictEqual(results.length, 2);
      assert.deepStrictEqual(results[0], { type: 'text', text: 'Fragmented' });
      assert.deepStrictEqual(results[1], { type: 'text', text: 'Complete' });
    });
    
    it('should handle errors in JSON parsing', async function() {
      // Simuliamo un flusso con dati JSON invalidi
      const mockStream = createMockReadableStream([
        'data: {"type":"text","text":"Valid"}\n',
        'data: {"broken:json}\n',
        'data: {"type":"text","text":"After Error"}\n'
      ]);
      
      const stream = createStreamParser(mockStream);
      const results = [];
      
      for await (const chunk of stream) {
        results.push(chunk);
      }
      
      assert.strictEqual(results.length, 2);
      assert.deepStrictEqual(results[0], { type: 'text', text: 'Valid' });
      assert.deepStrictEqual(results[1], { type: 'text', text: 'After Error' });
    });
    
    it('should respect cancellation via cancel()', async function() {
      // Simuliamo un flusso lungo che dovrebbe essere cancellato
      const mockStream = createMockReadableStream([
        'data: {"type":"text","text":"First"}\n',
        'data: {"type":"text","text":"Second"}\n',
        'data: {"type":"text","text":"Third"}\n',
        'data: {"type":"text","text":"Fourth"}\n'
      ]);
      
      const stream = createStreamParser(mockStream);
      const results = [];
      
      // Leggiamo solo i primi due chunk e poi cancelliamo
      let count = 0;
      for await (const chunk of stream) {
        results.push(chunk);
        count++;
        if (count >= 2) {
          stream.cancel();
          break;
        }
      }
      
      assert.strictEqual(results.length, 2);
    });
  });
  
  describe('createMockStream', function() {
    it('should emit chunks in order', async function() {
      const testChunks = [
        { type: 'text', text: 'First' },
        { type: 'text', text: 'Second' },
        { type: 'text', text: 'Third' }
      ];
      
      const stream = createMockStream(testChunks);
      const results = [];
      
      for await (const chunk of stream) {
        results.push(chunk);
      }
      
      assert.strictEqual(results.length, 3);
      assert.deepStrictEqual(results, testChunks);
    });
    
    it('should respect delays between chunks', async function() {
      const testChunks = [
        { type: 'text', text: 'First' },
        { type: 'text', text: 'Second' }
      ];
      
      const delayMs = 50;
      const stream = createMockStream(testChunks, delayMs);
      
      const startTime = Date.now();
      const results = [];
      
      for await (const chunk of stream) {
        results.push(chunk);
      }
      
      const duration = Date.now() - startTime;
      
      assert.strictEqual(results.length, 2);
      assert.ok(duration >= delayMs, `Duration ${duration}ms should be at least ${delayMs}ms`);
    });
    
    it('should respect cancellation', async function() {
      const testChunks = [
        { type: 'text', text: 'First' },
        { type: 'text', text: 'Second' },
        { type: 'text', text: 'Third' },
        { type: 'text', text: 'Fourth' }
      ];
      
      const stream = createMockStream(testChunks);
      const results = [];
      
      // Leggiamo solo i primi due chunk e poi cancelliamo
      let count = 0;
      for await (const chunk of stream) {
        results.push(chunk);
        count++;
        if (count >= 2) {
          stream.cancel();
          break;
        }
      }
      
      assert.strictEqual(results.length, 2);
    });
  });
  
  describe('createApiStream', function() {
    it('should throw if response has no body', function() {
      assert.throws(() => {
        createApiStream({ body: null });
      }, /Response non contiene un body leggibile/);
    });
    
    it('should wrap response body in a stream parser', async function() {
      const mockStream = createMockReadableStream([
        'data: {"type":"text","text":"API Response"}\n'
      ]);
      
      const mockResponse = {
        body: mockStream
      };
      
      const stream = createApiStream(mockResponse);
      const results = [];
      
      for await (const chunk of stream) {
        results.push(chunk);
      }
      
      assert.strictEqual(results.length, 1);
      assert.deepStrictEqual(results[0], { type: 'text', text: 'API Response' });
    });
  });
}); 