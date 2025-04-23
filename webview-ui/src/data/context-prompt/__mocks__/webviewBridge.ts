import { vi } from 'vitest';

export const postMessage = vi.fn();
export const on = vi.fn();
export const dispose = vi.fn();

// Esporta l'oggetto webviewBridge mockato
export const webviewBridge = {
  postMessage,
  on,
  dispose
}; 
 