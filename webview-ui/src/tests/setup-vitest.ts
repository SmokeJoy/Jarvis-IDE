import { vi, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// Fix per navigator.language
Object.defineProperty(navigator, 'language', {
  configurable: true,
  get: () => 'en-US',
  enumerable: true,
});

// Mock del meccanismo di comunicazione VSCode
vi.mock('../utils/vscode', () => ({
  vscode: {
    postMessage: vi.fn(),
  },
  // Include il supporto agli eventi, richiesto in alcuni test
  onMessage: {
    addListener: vi.fn(() => ({ dispose: vi.fn() })),
    removeListener: vi.fn(),
  },
}));

// Estendi expect con matchers di jest-dom
expect.extend({
  // Qui possono essere aggiunti matcher personalizzati se necessario
});

// Cleanup automatico dopo ogni test
afterEach(() => {
  // Pulisce il React Testing Library
  cleanup();
  // Reset dei mock
  vi.clearAllMocks();
});

// Setup globale per i test
vi.mock('react-virtuoso', () => {
  return {
    default: vi.fn(({ children }) => React.createElement('div', { 'data-testid': 'virtuoso' }, children)),
    VirtuosoGrid: vi.fn(({ children }) => React.createElement('div', { 'data-testid': 'virtuoso-grid' }, children)),
    TableVirtuoso: vi.fn(({ children }) => React.createElement('div', { 'data-testid': 'table-virtuoso' }, children)),
  };
});

// Disabilita i console.error durante i test per evitare rumore nei log
// ma mantienili in caso di errori nei test
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('React does not recognize')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Setup del contesto di rendering
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
    dispatchEvent: vi.fn(),
  })),
}); 