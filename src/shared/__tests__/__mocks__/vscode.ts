// Mock del modulo vscode per i test
const vscode = {
  OutputChannel: class {
    constructor() {}
    appendLine(value: string) {}
    clear() {}
    show() {}
    hide() {}
    dispose() {}
  },
  window: {
    createOutputChannel: (name: string) => new vscode.OutputChannel(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
  },
  workspace: {
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn(),
      update: jest.fn(),
      has: jest.fn(),
    }),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
    parse: (path: string) => ({ fsPath: path }),
  },
  EventEmitter: class {
    constructor() {}
    event = jest.fn();
    fire = jest.fn();
    dispose = jest.fn();
  },
  LogLevel: {
    Debug: 0,
    Info: 1,
    Warning: 2,
    Error: 3,
  },
};

export = vscode; 