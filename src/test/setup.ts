import { expect, vi } from 'vitest';

// Mock del modulo vscode
vi.mock('vscode', () => {
  // Mock di OutputChannel
  const mockOutputChannel = {
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn()
  };

  return {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      createOutputChannel: vi.fn(() => mockOutputChannel),
      withProgress: vi.fn((options, task) => task()),
      createWebviewPanel: vi.fn(),
      createTreeView: vi.fn(),
      createStatusBarItem: vi.fn(() => ({
        show: vi.fn(),
        hide: vi.fn(),
        dispose: vi.fn(),
        text: '',
        tooltip: '',
        command: ''
      }))
    },
    commands: {
      registerCommand: vi.fn(),
      executeCommand: vi.fn()
    },
    workspace: {
      getConfiguration: vi.fn(() => ({
        get: vi.fn(),
        has: vi.fn(),
        update: vi.fn()
      })),
      workspaceFolders: [],
      onDidChangeConfiguration: vi.fn(),
      getWorkspaceFolder: vi.fn(),
      openTextDocument: vi.fn(() => Promise.resolve({
        getText: vi.fn(),
        save: vi.fn()
      }))
    },
    Uri: {
      file: (path: string) => ({ fsPath: path, path }),
      parse: vi.fn()
    },
    EventEmitter: vi.fn(() => ({
      event: vi.fn(),
      fire: vi.fn()
    })),
    OutputChannel: mockOutputChannel,
    extensions: {
      getExtension: vi.fn()
    },
    languages: {
      registerHoverProvider: vi.fn(),
      registerCompletionItemProvider: vi.fn()
    },
    env: {
      clipboard: {
        writeText: vi.fn()
      }
    },
    ThemeIcon: vi.fn(),
    TreeItem: vi.fn(),
    TreeItemCollapsibleState: {
      None: 0,
      Collapsed: 1,
      Expanded: 2
    },
    ProgressLocation: {
      Notification: 1,
      Window: 10
    },
    ViewColumn: {
      One: 1,
      Two: 2,
      Active: -1
    },
    StatusBarAlignment: {
      Left: 1,
      Right: 2
    },
    DiagnosticSeverity: {
      Error: 0,
      Warning: 1,
      Information: 2,
      Hint: 3
    },
    WebviewPanel: vi.fn(),
    Disposable: {
      from: vi.fn()
    }
  };
});

// Anche process.env potrebbe dover essere mockato per alcuni test
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_TO_WEBVIEW: 'false',
    VSCODE_CWD: '/mock/path',
    OPENROUTER_API_KEY: 'test-api-key'
  }
}));

// Mock delle funzioni node.js
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => '{}'),
    writeFileSync: vi.fn(),
    appendFileSync: vi.fn(),
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    statSync: vi.fn(() => ({ isDirectory: () => true })),
    readdirSync: vi.fn(() => []),
    readFile: vi.fn((path, encoding, callback) => {
      if (callback) callback(null, '{}');
      return Promise.resolve('{}');
    }),
    writeFile: vi.fn((path, data, callback) => {
      if (callback) callback(null);
      return Promise.resolve();
    }),
    mkdir: vi.fn((path, options, callback) => {
      if (typeof options === 'function') {
        options(null);
      } else if (callback) {
        callback(null);
      }
      return Promise.resolve();
    })
  }
}));

// Esporta expect per i test
export { expect }; 