// Mock setup for test environment
import * as vi from 'vitest';

// Mock the vscode module
vi.mock(
  'vscode',
  () => {
    return require('./__mocks__/vscode');
  },
  { virtual: true }
);

// Setup global mocks
beforeEach(() => {
  // Add any global mocks here
});
