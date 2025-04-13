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

vi.mock('vscode', () => {
  return {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      createOutputChannel: vi.fn(),
      createWebviewPanel: vi.fn(),
      createTextDocument: vi.fn(),
      showTextDocument: vi.fn(),
    },
    workspace: {
      getConfiguration: vi.fn(),
      workspaceFolders: [],
      onDidChangeConfiguration: vi.fn(),
      onDidChangeWorkspaceFolders: vi.fn(),
      onDidChangeTextDocument: vi.fn(),
    },
    commands: {
      registerCommand: vi.fn(),
      executeCommand: vi.fn(),
    },
    Uri: {
      file: vi.fn(),
      parse: vi.fn(),
    },
    Position: vi.fn(),
    Range: vi.fn(),
    Selection: vi.fn(),
    TextEdit: vi.fn(),
    WorkspaceEdit: vi.fn(),
    ConfigurationTarget: {
      Global: 1,
      Workspace: 2,
      WorkspaceFolder: 3,
    },
  };
});
