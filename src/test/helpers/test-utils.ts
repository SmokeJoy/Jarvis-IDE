import { vi } from 'vitest';
import type { Mock } from 'vitest';
import type * as vscode from 'vscode';

export interface MockVSCode {
    window: {
        showInformationMessage: Mock;
        showErrorMessage: Mock;
        showWarningMessage: Mock;
        createOutputChannel: Mock;
        createWebviewPanel: Mock;
        createTextDocument: Mock;
        showTextDocument: Mock;
    };
    workspace: {
        getConfiguration: Mock;
        workspaceFolders: any[];
        onDidChangeConfiguration: Mock;
        onDidChangeWorkspaceFolders: Mock;
        onDidChangeTextDocument: Mock;
    };
    commands: {
        registerCommand: Mock;
        executeCommand: Mock;
    };
    Uri: {
        file: Mock;
        parse: Mock;
    };
    Position: Mock;
    Range: Mock;
    Selection: Mock;
    TextEdit: Mock;
    WorkspaceEdit: Mock;
    ConfigurationTarget: {
        Global: number;
        Workspace: number;
        WorkspaceFolder: number;
    };
}

export const getMockVSCode = (): MockVSCode => {
    const vscodeMock = vi.mocked(require('vscode').default);
    return vscodeMock;
};

export const resetMocks = () => {
    vi.clearAllMocks();
};

export const createMockWebviewPanel = () => {
    return {
        webview: {
            html: '',
            onDidReceiveMessage: vi.fn(),
            postMessage: vi.fn(),
        },
        onDidDispose: vi.fn(),
        reveal: vi.fn(),
        dispose: vi.fn(),
    };
};

export const createMockOutputChannel = () => {
    return {
        appendLine: vi.fn(),
        append: vi.fn(),
        clear: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        dispose: vi.fn(),
    };
};

export const createMockTextDocument = (content: string = '') => {
    return {
        getText: vi.fn().mockReturnValue(content),
        fileName: 'test.ts',
        uri: { fsPath: '/test/test.ts' },
        languageId: 'typescript',
    };
}; 
 