import { vi } from 'vitest';
import * as vscode from 'vscode';

// Mock di vscode
vi.mock('vscode', () => ({
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      clear: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    })),
    createWebviewPanel: vi.fn(() => ({
      webview: {
        html: '',
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn(),
      },
      onDidDispose: vi.fn(),
      reveal: vi.fn(),
      dispose: vi.fn(),
    })),
    withProgress: vi.fn((_, task) => task({})),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn(),
      has: vi.fn(),
    })),
    openTextDocument: vi.fn(),
    onDidChangeConfiguration: vi.fn(),
    workspaceFolders: [],
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn(),
  },
  Uri: {
    file: vi.fn((path) => ({ fsPath: path })),
    parse: vi.fn(),
  },
  ExtensionContext: {
    globalState: {
      get: vi.fn(),
      update: vi.fn(),
    },
    subscriptions: [],
    extensionPath: '/test/extension/path',
    storagePath: '/test/storage/path',
    workspaceState: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
  languages: {
    registerCodeLensProvider: vi.fn(),
  },
  ProgressLocation: {
    Notification: 1,
  },
  ViewColumn: {
    One: 1,
    Two: 2,
  },
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
}));

// Configurazione globale per i test
beforeAll(() => {
  // Setup globale
});

afterAll(() => {
  // Cleanup globale
});

beforeEach(() => {
  // Reset dei mock prima di ogni test
  vi.clearAllMocks();
});
