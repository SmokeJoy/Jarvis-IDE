import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Extend Vitest's expect with Jest DOM matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock di window.crypto per i test
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (array: Uint8Array) => array.map(() => Math.floor(Math.random() * 256))
  }
});

// Mock di console per ridurre il rumore nei test
vi.spyOn(console, 'debug').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {}); 