// jest.setup.cjs
// Configura il mock globale di fetch
require('jest-fetch-mock').enableMocks();

// Configurazione globale per TextEncoder/TextDecoder (necessari per i test di streaming)
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock per ReadableStream se necessario
class MockReadableStreamDefaultReader {
  constructor(chunks = []) {
    this.chunks = chunks.slice();
    this.index = 0;
  }

  async read() {
    if (this.index >= this.chunks.length) {
      return { done: true, value: undefined };
    }
    const value = this.chunks[this.index++];
    return { done: false, value };
  }

  releaseLock() {}
}

class MockReadableStream {
  constructor(options = {}) {
    this._controller = options.start ? options.start : () => {};
    this._reader = null;
  }

  getReader() {
    this._reader = new MockReadableStreamDefaultReader();
    return this._reader;
  }
}

// Solo se il test non trova ReadableStream nell'ambiente
if (!global.ReadableStream) {
  global.ReadableStream = MockReadableStream;
}

// Disabilita console.error durante i test per ridurre il rumore nell'output di test
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' && 
    (args[0].includes('test was not wrapped in act') ||
     args[0].includes('Warning:'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Configurazione globale per i test Jest

// Aumenta il timeout per i test
jest.setTimeout(30000); 