import { vi } from "vitest";

// Mock di OutputChannel
const mockOutputChannel = {
  appendLine: vi.fn(),
  append: vi.fn(),
  clear: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  dispose: vi.fn()
};

export const window = {
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
};

export const workspace = {
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
};

export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn()
};

export const Uri = {
  file: (path) => ({ fsPath: path, path }),
  parse: vi.fn()
};

export const EventEmitter = vi.fn(() => ({
  event: vi.fn(),
  fire: vi.fn()
}));

export const OutputChannel = mockOutputChannel;

export const extensions = {
  getExtension: vi.fn()
};

export const languages = {
  registerHoverProvider: vi.fn(),
  registerCompletionItemProvider: vi.fn()
};

export const env = {
  clipboard: {
    writeText: vi.fn()
  }
};

export const ThemeIcon = vi.fn();
export const TreeItem = vi.fn();
export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2
};

export const ProgressLocation = {
  Notification: 1,
  Window: 10
};

export const ViewColumn = {
  One: 1,
  Two: 2,
  Active: -1
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2
};

export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3
};

export const WebviewPanel = vi.fn();
export const Disposable = {
  from: vi.fn()
};

export default {
  window,
  workspace,
  commands,
  Uri,
  EventEmitter,
  OutputChannel,
  extensions,
  languages,
  env,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  ProgressLocation,
  ViewColumn,
  StatusBarAlignment,
  DiagnosticSeverity,
  WebviewPanel,
  Disposable
}; 