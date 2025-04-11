import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global jest object for compatibility with Jest-based tests
globalThis.jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  unmock: vi.unmock,
  resetModules: vi.resetModules
}; 