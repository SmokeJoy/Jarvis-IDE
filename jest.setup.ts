import '@testing-library/jest-dom';

// Mock per il WebView bridge
const mockWebviewBridge = {
  postMessage: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn()
};

// Mock per l'oggetto vscode
const mockVSCode = {
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      clear: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn()
    }))
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn()
    }))
  }
};

// Esponi i mock globalmente
(global as any).acquireVsCodeApi = () => mockVSCode;
(global as any).vscode = mockVSCode; 
 