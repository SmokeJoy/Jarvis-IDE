/**
 * @file setupTests.ts
 * @description File di configurazione per i test con Vitest e react-testing-library
 * @version 1.0.0
 */

// Import delle estensioni di jest-dom per migliorare gli assertions nei test
import '@testing-library/jest-dom';
import matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Estendi i matchers di vitest con quelli di jest-dom
expect.extend(matchers);

// Mock per acquireVsCodeApi
window.acquireVsCodeApi = () => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
});

// Mock per matchMedia (usato da alcuni componenti UI)
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() {},
    media: '',
    onchange: null
  };
}; 