/**
 * @file setupWebviewMocks.ts
 * @description Setup globale per i mock utilizzati nei test Vitest
 * @version 1.0.0
 */

import { vi } from 'vitest';

// Mock dell'API VSCode
const mockVSCodeAPI = {
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn()
};

global.acquireVsCodeApi = vi.fn(() => mockVSCodeAPI);

// Mock delle funzioni del browser
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock di localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    length: 0
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock di sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    length: 0
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock per WebSocket
class MockWebSocket {
  url: string;
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  readyState: number = WebSocket.CONNECTING;
  CONNECTING: number = WebSocket.CONNECTING;
  OPEN: number = WebSocket.OPEN;
  CLOSING: number = WebSocket.CLOSING;
  CLOSED: number = WebSocket.CLOSED;

  constructor(url: string) {
    this.url = url;
    // Simula una connessione automatica dopo un breve ritardo
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen.call(this, new Event('open'));
      }
    }, 50);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    vi.fn();
  }

  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose.call(this, new CloseEvent('close', { code, reason }));
    }
  }

  // Metodo per simulare la ricezione di un messaggio
  mockReceiveMessage(data: any): void {
    if (this.onmessage) {
      this.onmessage.call(this, new MessageEvent('message', { data }));
    }
  }

  // Metodo per simulare un errore
  mockError(error: any): void {
    if (this.onerror) {
      this.onerror.call(this, new ErrorEvent('error', { message: error }));
    }
  }
}

global.WebSocket = MockWebSocket as any;

// Esporta i mock per l'uso nei test
export { mockVSCodeAPI, localStorageMock, sessionStorageMock, MockWebSocket };

// Mock per window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock per navigator.language (rendendo la proprietà configurabile)
Object.defineProperty(navigator, 'language', {
  configurable: true,
  get: () => 'it-IT'
});

// Utility per resettare tutti i mock in un test
export const resetAllMocks = (): void => {
  vi.clearAllMocks();
  vi.resetAllMocks();
}; 