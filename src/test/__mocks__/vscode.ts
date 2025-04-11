import { vi } from "vitest";

export const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  createOutputChannel: vi.fn(),
  createWebviewPanel: vi.fn(() => ({
    webview: {
      html: '',
      onDidReceiveMessage: vi.fn(),
      postMessage: vi.fn(),
    },
    reveal: vi.fn(),
    onDidDispose: vi.fn(),
    dispose: vi.fn(),
  })),
  createTextDocument: vi.fn(),
  showTextDocument: vi.fn(),
};

export const workspace = {
  getConfiguration: vi.fn(() => ({ get: vi.fn(), update: vi.fn() })),
  workspaceFolders: [],
  onDidChangeConfiguration: vi.fn(),
  onDidChangeWorkspaceFolders: vi.fn(),
  onDidChangeTextDocument: vi.fn(),
};

export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn(),
};

export const Uri = {
  file: vi.fn((p: string) => ({ fsPath: p })),
  parse: vi.fn(),
};

export const Position = vi.fn();
export const Range = vi.fn();
export const Selection = vi.fn();
export const TextEdit = vi.fn();
export const WorkspaceEdit = vi.fn();

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
};

export const ViewColumn = {
  One: 1,
};

export default {
  window,
  workspace,
  commands,
  Uri,
  Position,
  Range,
  Selection,
  TextEdit,
  WorkspaceEdit,
  ConfigurationTarget,
  ViewColumn,
}; 