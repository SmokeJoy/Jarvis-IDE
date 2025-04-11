/**
 * @file setup.ts
 * @description File di setup per i test vitest
 * @version 1.0.0
 */

/**
 * Setup globale per i test Vitest
 * Questo file viene caricato automaticamente prima dell'esecuzione dei test
 * @author AI1 | Jarvis MAS v1.0.0
 */

import { vi } from 'vitest';

// Mock per il modulo 'vscode'
vi.mock('vscode', async () => {
  const Uri = {
    file: (path: string) => ({ fsPath: path, path, scheme: 'file' }),
    parse: (uri: string) => ({ fsPath: uri, path: uri, scheme: uri.split(':')[0] || 'file' })
  };

  const Position = class {
    constructor(public line: number, public character: number) {}
    isAfter = vi.fn().mockReturnValue(false);
    isAfterOrEqual = vi.fn().mockReturnValue(false);
    isBefore = vi.fn().mockReturnValue(false);
    isBeforeOrEqual = vi.fn().mockReturnValue(false);
    isEqual = vi.fn().mockReturnValue(false);
    translate = vi.fn().mockReturnThis();
    with = vi.fn().mockReturnThis();
  };

  const Range = class {
    constructor(
      public start: typeof Position.prototype,
      public end: typeof Position.prototype
    ) {}
    contains = vi.fn().mockReturnValue(false);
    isEqual = vi.fn().mockReturnValue(false);
    intersection = vi.fn().mockReturnThis();
    union = vi.fn().mockReturnThis();
    with = vi.fn().mockReturnThis();
  };

  const Diagnostic = class {
    constructor(
      public range: typeof Range.prototype,
      public message: string,
      public severity: number
    ) {}
    source = 'test';
    code = '';
    relatedInformation = [];
  };

  const DiagnosticSeverity = {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
  };

  const EventEmitter = class {
    event = vi.fn();
    fire = vi.fn();
    dispose = vi.fn();
  };

  const QuickPickItem = class {
    label = '';
    description = '';
    detail = '';
    picked = false;
    alwaysShow = false;
  };

  const OutputChannel = class {
    name = 'test';
    append = vi.fn();
    appendLine = vi.fn();
    clear = vi.fn();
    show = vi.fn();
    hide = vi.fn();
    dispose = vi.fn();
  };

  const StatusBarItem = class {
    text = '';
    tooltip = '';
    command = '';
    show = vi.fn();
    hide = vi.fn();
    dispose = vi.fn();
  };

  const WebviewPanel = class {
    onDidDispose = vi.fn();
    onDidChangeViewState = vi.fn();
    reveal = vi.fn();
    dispose = vi.fn();
    webview = {
      html: '',
      onDidReceiveMessage: vi.fn(),
      postMessage: vi.fn(),
      asWebviewUri: vi.fn().mockImplementation((uri) => uri),
      cspSource: '',
      options: {}
    };
  };

  // Crea il mock principale di vscode
  return {
    // Namespace principali
    workspace: {
      getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn().mockImplementation((key) => null),
        update: vi.fn().mockReturnValue(Promise.resolve()),
        has: vi.fn().mockReturnValue(false),
        inspect: vi.fn(),
      }),
      workspaceFolders: [{ uri: Uri.file('/test-workspace'), name: 'test', index: 0 }],
      onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidChangeWorkspaceFolders: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidOpenTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidChangeTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidCloseTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidSaveTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      openTextDocument: vi.fn().mockResolvedValue({
        fileName: '/test-file.ts',
        getText: vi.fn().mockReturnValue(''),
        save: vi.fn().mockResolvedValue(true),
        lineAt: vi.fn().mockReturnValue({ text: '' }),
        lineCount: 0,
        uri: Uri.file('/test-file.ts')
      }),
      applyEdit: vi.fn().mockResolvedValue(true),
      createFileSystemWatcher: vi.fn().mockReturnValue({
        onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        dispose: vi.fn()
      }),
      fs: {
        readFile: vi.fn().mockResolvedValue(Buffer.from('')),
        writeFile: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        rename: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockResolvedValue({
          type: 1, // FileType.File
          size: 0,
          ctime: 0,
          mtime: 0
        })
      },
      asRelativePath: vi.fn().mockImplementation((path) => path),
      saveAll: vi.fn().mockResolvedValue(true)
    },
    
    window: {
      showInformationMessage: vi.fn().mockResolvedValue(null),
      showWarningMessage: vi.fn().mockResolvedValue(null),
      showErrorMessage: vi.fn().mockResolvedValue(null),
      showQuickPick: vi.fn().mockResolvedValue(null),
      showInputBox: vi.fn().mockResolvedValue(null),
      showOpenDialog: vi.fn().mockResolvedValue(null),
      showSaveDialog: vi.fn().mockResolvedValue(null),
      createOutputChannel: vi.fn().mockReturnValue(new OutputChannel()),
      withProgress: vi.fn().mockImplementation((options, task) => task({
        report: vi.fn()
      })),
      createWebviewPanel: vi.fn().mockReturnValue(new WebviewPanel()),
      createStatusBarItem: vi.fn().mockReturnValue(new StatusBarItem()),
      createTextEditorDecorationType: vi.fn().mockReturnValue({
        key: 'decoration',
        dispose: vi.fn()
      }),
      visibleTextEditors: [],
      activeTextEditor: {
        document: {
          uri: Uri.file('/test-file.ts'),
          fileName: '/test-file.ts',
          getText: vi.fn().mockReturnValue(''),
          lineAt: vi.fn().mockReturnValue({ text: '' }),
          lineCount: 0
        },
        selection: new Range(new Position(0, 0), new Position(0, 0)),
        edit: vi.fn().mockResolvedValue(true),
        setDecorations: vi.fn(),
        revealRange: vi.fn(),
        viewColumn: 1
      },
      onDidChangeActiveTextEditor: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidChangeVisibleTextEditors: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      onDidChangeTextEditorSelection: vi.fn().mockReturnValue({ dispose: vi.fn() })
    },
    
    commands: {
      registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      executeCommand: vi.fn().mockResolvedValue(null),
      registerTextEditorCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      getCommands: vi.fn().mockResolvedValue([])
    },
    
    languages: {
      registerHoverProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      registerDefinitionProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      registerCompletionItemProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      registerCodeActionsProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      createDiagnosticCollection: vi.fn().mockReturnValue({
        set: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        dispose: vi.fn()
      })
    },
    
    extensions: {
      getExtension: vi.fn().mockReturnValue({
        id: 'jarvis-ide',
        extensionPath: '/test-extension-path',
        extensionUri: Uri.file('/test-extension-path'),
        extensionKind: 1, // ExtensionKind.Workspace
        isActive: true,
        packageJSON: { version: '1.0.0' },
        exports: {},
        activate: vi.fn().mockResolvedValue(null)
      }),
      all: []
    },
    
    env: {
      language: 'it',
      appName: 'VS Code Test',
      appRoot: '/test-app-root',
      clipboard: {
        readText: vi.fn().mockResolvedValue(''),
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      machineId: 'test-machine-id',
      sessionId: 'test-session-id',
      shell: '/bin/bash',
      uriScheme: 'vscode'
    },
    
    // Classi ed enumerazioni
    Uri,
    Position,
    Range,
    Selection: Range,
    Location: class {
      constructor(public uri: typeof Uri, public range: typeof Range) {}
    },
    Diagnostic,
    DiagnosticSeverity,
    EventEmitter,
    QuickPickItem,
    ThemeColor: class {
      constructor(public id: string) {}
    },
    ThemeIcon: class {
      constructor(public id: string) {}
      static File = new this('file');
      static Folder = new this('folder');
    },
    
    // Costanti
    ViewColumn: {
      Active: -1,
      Beside: -2,
      One: 1,
      Two: 2,
      Three: 3
    },
    
    // Funzioni di utilità
    CancellationTokenSource: class {
      token = { isCancellationRequested: false, onCancellationRequested: vi.fn() };
      cancel = vi.fn();
      dispose = vi.fn();
    },
    
    // Disposable base
    Disposable: {
      from: (...disposables: { dispose: () => any }[]) => ({
        dispose: vi.fn()
      })
    }
  };
});

// Setup globale per i test
beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Setup di default che non fa nulla, in modo da consentire l'avvio dei test
export default function() {}; 