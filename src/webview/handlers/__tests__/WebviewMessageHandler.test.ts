import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { WebviewMessageHandler } from '../WebviewMessageHandler';
import { Logger } from '../../../utils/logger';
import {
  WebviewMessageType,
  WebviewReadyMessage,
  WebviewErrorMessage,
  WebviewLogMessage,
  WebviewStateUpdateMessage,
  WebviewCommandMessage,
  WebviewResponseMessage,
} from '../../../shared/types/webview.types';

// Mock vscode
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn(),
    })),
    onDidChangeConfiguration: vi.fn(),
  },
  window: {
    activeColorTheme: {
      kind: 1, // Light theme
    },
    onDidChangeActiveColorTheme: vi.fn(),
  },
  commands: {
    executeCommand: vi.fn(),
  },
}));

// Mock Logger
vi.mock('../../../utils/logger', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('WebviewMessageHandler', () => {
  let handler: WebviewMessageHandler;
  let mockContext: vscode.ExtensionContext;
  let mockWebview: vscode.Webview;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock context
    mockContext = {
      extension: {
        packageJSON: {
          version: '1.0.0',
        },
      },
    } as vscode.ExtensionContext;

    // Setup mock webview
    mockWebview = {
      postMessage: vi.fn(),
    } as unknown as vscode.Webview;

    // Create handler instance
    handler = new WebviewMessageHandler(mockContext);
  });

  describe('Initialization', () => {
    test('should store webview reference', () => {
      handler.initialize(mockWebview);
      expect(handler['_webview']).toBe(mockWebview);
    });

    test('should register configuration change listener', () => {
      const mockListener = { dispose: vi.fn() };
      vi.mocked(vscode.workspace.onDidChangeConfiguration).mockReturnValue(mockListener as any);

      handler.initialize(mockWebview);

      expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
      expect(handler['_disposables']).toContain(mockListener);
    });

    test('should register theme change listener', () => {
      const mockListener = { dispose: vi.fn() };
      vi.mocked(vscode.window.onDidChangeActiveColorTheme).mockReturnValue(mockListener as any);

      handler.initialize(mockWebview);

      expect(vscode.window.onDidChangeActiveColorTheme).toHaveBeenCalled();
      expect(handler['_disposables']).toContain(mockListener);
    });

    test('should send initial state after initialization', () => {
      handler.initialize(mockWebview);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WebviewMessageType.STATE_UPDATE,
          payload: expect.objectContaining({
            path: ['initial'],
          }),
        })
      );
    });
  });

  describe('Disposal', () => {
    let mockConfigListener: vscode.Disposable;
    let mockThemeListener: vscode.Disposable;

    beforeEach(() => {
      mockConfigListener = { dispose: vi.fn() };
      mockThemeListener = { dispose: vi.fn() };

      vi.mocked(vscode.workspace.onDidChangeConfiguration).mockReturnValue(mockConfigListener);
      vi.mocked(vscode.window.onDidChangeActiveColorTheme).mockReturnValue(mockThemeListener);

      handler.initialize(mockWebview);
    });

    test('should dispose of all registered disposables', () => {
      handler.dispose();

      expect(mockConfigListener.dispose).toHaveBeenCalled();
      expect(mockThemeListener.dispose).toHaveBeenCalled();
      expect(handler['_disposables']).toHaveLength(0);
    });

    test('should clear state', () => {
      // Add some state
      handler['_state'].set('test', 'value');

      handler.dispose();

      expect(handler['_state'].size).toBe(0);
    });

    test('should clear webview reference', () => {
      handler.dispose();

      expect(handler['_webview']).toBeNull();
    });

    test('should be safe to call multiple times', () => {
      handler.dispose();
      handler.dispose();
      handler.dispose();

      // Should not throw and should still have cleared everything
      expect(handler['_disposables']).toHaveLength(0);
      expect(handler['_state'].size).toBe(0);
      expect(handler['_webview']).toBeNull();
    });
  });

  describe('Message Dispatch', () => {
    test('should handle READY message', () => {
      const message: WebviewReadyMessage = {
        type: WebviewMessageType.READY,
      };

      handler.handleMessage(message);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WebviewMessageType.STATE_UPDATE,
          payload: expect.objectContaining({
            path: ['initial'],
          }),
        })
      );
    });

    test('should handle ERROR message', () => {
      const message: WebviewMessageUnion = {
        type: 'error',
        payload: {
          message: 'Test error',
          code: 'TEST_ERROR',
        },
      };

      handler.handleMessage(message);

      expect(vi.mocked(Logger).mock.results[0].value.error).toHaveBeenCalledWith(
        'Webview error: Test error',
        expect.objectContaining({
          code: 'TEST_ERROR',
        })
      );
    });

    test('should handle LOG message', () => {
      const message: WebviewLogMessage = {
        type: WebviewMessageType.LOG,
        payload: {
          level: 'info',
          message: 'Test log',
          data: { test: true },
        },
      };

      handler.handleMessage(message);

      expect(vi.mocked(Logger).mock.results[0].value.info).toHaveBeenCalledWith('Test log', {
        test: true,
      });
    });

    test('should handle STATE_UPDATE message', () => {
      const message: WebviewStateUpdateMessage = {
        type: WebviewMessageType.STATE_UPDATE,
        payload: {
          path: ['settings', 'theme'],
          value: 'dark',
        },
      };

      handler.handleMessage(message);

      expect(vscode.workspace.getConfiguration().update).toHaveBeenCalledWith(
        'theme',
        'dark',
        vscode.ConfigurationTarget.Global
      );
    });

    test('should handle COMMAND message', async () => {
      const message: WebviewCommandMessage = {
        type: WebviewMessageType.COMMAND,
        payload: {
          command: 'test.command',
          args: ['arg1', 'arg2'],
        },
      };

      vi.mocked(vscode.commands.executeCommand).mockResolvedValue('success');

      await handler.handleMessage(message);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith('test.command', 'arg1', 'arg2');

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WebviewMessageType.RESPONSE,
          payload: expect.objectContaining({
            requestId: 'test.command',
            data: 'success',
          }),
        })
      );
    });

    test('should handle RESPONSE message', () => {
      const message: WebviewResponseMessage = {
        type: WebviewMessageType.RESPONSE,
        payload: {
          requestId: 'test.request',
          data: { result: 'success' },
        },
      };

      handler.handleMessage(message);

      // Verify state was updated
      expect(handler['_state'].get('response.test.request')).toEqual(
        expect.objectContaining({
          data: { result: 'success' },
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle command execution errors', async () => {
      const message: WebviewCommandMessage = {
        type: WebviewMessageType.COMMAND,
        payload: {
          command: 'test.command',
          args: [],
        },
      };

      const error = new Error('Command failed');
      vi.mocked(vscode.commands.executeCommand).mockRejectedValue(error);

      await handler.handleMessage(message);

      expect(mockWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WebviewMessageType.ERROR,
          payload: expect.objectContaining({
            message: 'Command failed',
            code: 'COMMAND_EXECUTION_ERROR',
          }),
        })
      );
    });

    test('should handle invalid message types', () => {
      const invalidMessage: WebviewMessageUnion = {
        type: 'mcpConnected',
        payload: 'invalid_payload',
      };

      handler.handleMessage(invalidMessage as any);

      expect(vi.mocked(Logger).mock.results[0].value.warn).toHaveBeenCalledWith(
        'Unhandled message type: INVALID_TYPE'
      );
    });
  });

  describe('State Management', () => {
    test('should update nested state correctly', () => {
      const message: WebviewMessageUnion = {
        type: 'stateUpdate',
        payload: {
          path: ['ui', 'theme'],
          value: 'dark',
        },
      };

      handler.handleMessage(message);

      const state = handler['_state'];
      expect(state.get('nested').get('deep').get('value')).toBe('test');
    });

    test('should persist settings to VS Code configuration', () => {
      const message: WebviewStateUpdateMessage = {
        type: WebviewMessageType.STATE_UPDATE,
        payload: {
          path: ['settings', 'api', 'key'],
          value: 'test-key',
        },
      };

      handler.handleMessage(message);

      expect(vscode.workspace.getConfiguration().update).toHaveBeenCalledWith(
        'settings.api.key',
        'test-key',
        vscode.ConfigurationTarget.Global
      );
    });
  });
});
