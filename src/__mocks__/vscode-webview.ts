import { vi } from 'vitest';

export default {
  WebviewApi: class {
    postMessage = vi.fn();
    getState = vi.fn();
    setState = vi.fn();
  }
}; 