import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import { vi } from 'vitest';

// Mock di window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock di vscode
vi.mock('vscode', () => ({
  default: {
    window: {
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      createOutputChannel: vi.fn(),
      createWebviewPanel: vi.fn(),
      createTextDocument: vi.fn(),
      showTextDocument: vi.fn()
    },
    workspace: {
      workspaceFolders: [],
      onDidChangeConfiguration: vi.fn(),
      onDidChangeWorkspaceFolders: vi.fn(),
      onDidChangeTextDocument: vi.fn()
    },
    commands: {
      executeCommand: vi.fn()
    },
    Uri: {
      parse: vi.fn()
    },
    Range: vi.fn(),
    Selection: vi.fn(),
    TextEdit: vi.fn(),
    WorkspaceEdit: vi.fn(),
    ConfigurationTarget: {
      Global: 1,
      Workspace: 2,
      WorkspaceFolder: 3
    }
  }
}));
