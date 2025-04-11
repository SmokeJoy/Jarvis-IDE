/**
 * Mock del modulo vscode per i test
 */
import { vi } from 'vitest';

const vscode = {
  // Namespace workspace
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn().mockImplementation((key) => null),
      update: vi.fn(),
      has: vi.fn().mockReturnValue(false)
    }),
    workspaceFolders: [{ uri: { fsPath: '/test-workspace' } }],
    onDidChangeConfiguration: vi.fn()
  },
  
  // Namespace window
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    createOutputChannel: vi.fn().mockReturnValue({
      appendLine: vi.fn(),
      clear: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn()
    })
  },
  
  // Namespace commands
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
  },
  
  // Namespace extensions
  extensions: {
    getExtension: vi.fn().mockReturnValue({
      packageJSON: { version: '1.0.0' }
    })
  }
};

export default vscode; 