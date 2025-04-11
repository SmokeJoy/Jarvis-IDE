/**
 * @file setup.ts
 * @description Setup globale per i test con Vitest
 */

import { expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Mock globale per VSCode
vi.mock('vscode', async () => {
  const outputChannel = {
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  };

  return {
    window: {
      createOutputChannel: vi.fn().mockReturnValue(outputChannel),
      showInformationMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      showErrorMessage: vi.fn(),
    },
    workspace: {
      getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn(),
        update: vi.fn(),
      }),
      workspaceFolders: [{ uri: { fsPath: '/workspace-test' } }],
    },
    commands: {
      registerCommand: vi.fn(),
      executeCommand: vi.fn(),
    },
    Uri: {
      file: (path: string) => ({ fsPath: path, path }),
      parse: (path: string) => ({ fsPath: path, path }),
    },
    LogLevel: {
      Trace: 0,
      Debug: 1,
      Info: 2,
      Warning: 3,
      Error: 4,
      Critical: 5,
      Off: 6,
    },
    OutputChannel: outputChannel.constructor,
  };
});

// Mock globale per l'API VSCode dell'extension
vi.mock('../../../src/vscode-api', async () => {
  return {
    vscode: {
      postMessage: vi.fn(),
    },
  };
});

// Setup per i test dei componenti React
beforeAll(() => {
  // Imposta i timer falsi per controllare il timing nei test
  vi.useFakeTimers();
  
  // Mock di console.error per ridurre il rumore nei test
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  // Mock dell'oggetto window.crypto per i test
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      subtle: {
        digest: vi.fn().mockImplementation(() => Promise.resolve(new ArrayBuffer(32))),
      },
    },
  });

  // Mock per messaggi VSCode
  global.window.addEventListener = vi.fn().mockImplementation((event, callback) => {
    if (event === 'message') {
      (global as any).__messageListeners = (global as any).__messageListeners || [];
      (global as any).__messageListeners.push(callback);
    }
  });

  // Metodo per inviare messaggi simulati nei test
  (global as any).postVSCodeMessage = (message: any) => {
    const event = { data: message };
    ((global as any).__messageListeners || []).forEach((listener: any) => listener(event));
  };
});

// Pulizia dopo ogni test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Ripristina al termine di tutti i test
afterAll(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
}); 