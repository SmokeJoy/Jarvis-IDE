import { vi } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebviewManager } from './WebviewManager';
import { vscode } from '../../vitest.setup';
import { WebviewBridge } from '../utils/WebviewBridge';

vi.mock('../utils/WebviewBridge');

describe('WebviewManager', () => {
  let manager: WebviewManager;
  let mockPanel: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn(),
      },
      onDidDispose: vi.fn(),
      onDidChangeViewState: vi.fn(),
      reveal: vi.fn(),
      dispose: vi.fn(),
    };

    mockContext = {
      extensionUri: vscode.Uri.file('test'),
      subscriptions: [],
    };

    vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel);
    
    manager = new WebviewManager(mockContext);
  });

  describe('initialization', () => {
    it('should create webview panel with correct options', () => {
      expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
        'jarvisIDE',
        'Jarvis IDE',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.file('test')],
        }
      );
    });

    it('should initialize WebviewBridge', () => {
      expect(WebviewBridge).toHaveBeenCalledWith(mockPanel.webview);
    });

    it('should set up panel dispose handler', () => {
      expect(mockPanel.onDidDispose).toHaveBeenCalled();
    });

    it('should set up view state change handler', () => {
      expect(mockPanel.onDidChangeViewState).toHaveBeenCalled();
    });
  });

  describe('panel management', () => {
    it('should reveal panel when already exists', () => {
      manager.show();
      expect(mockPanel.reveal).toHaveBeenCalled();
    });

    it('should dispose panel', () => {
      manager.dispose();
      expect(mockPanel.dispose).toHaveBeenCalled();
    });

    it('should handle panel disposal', () => {
      const disposeFn = vi.mocked(mockPanel.onDidDispose).mock.calls[0][0];
      disposeFn();
      expect(manager.isDisposed()).toBe(true);
    });
  });

  describe('webview content', () => {
    it('should set initial HTML content', () => {
      expect(mockPanel.webview.html).not.toBe('');
      expect(mockPanel.webview.html).toContain('<!DOCTYPE html>');
    });

    it('should include required meta tags', () => {
      const html = mockPanel.webview.html;
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('<meta http-equiv="Content-Security-Policy"');
    });

    it('should include required scripts', () => {
      const html = mockPanel.webview.html;
      expect(html).toContain('<script type="module"');
      expect(html).toContain('main.js');
    });
  });

  describe('message handling', () => {
    it('should handle incoming messages via WebviewBridge', () => {
      const mockBridge = vi.mocked(WebviewBridge).mock.instances[0];
      expect(mockBridge.on).toHaveBeenCalled();
    });

    it('should send messages via WebviewBridge', () => {
      const message = { type: 'test', payload: {} };
      manager.sendMessage(message);
      
      const mockBridge = vi.mocked(WebviewBridge).mock.instances[0];
      expect(mockBridge.sendMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('resource management', () => {
    it('should get webview resource uri', () => {
      const uri = manager.getWebviewResourceUri('test.js');
      expect(uri.path).toContain('test.js');
    });

    it('should handle media resources', () => {
      const uri = manager.getWebviewResourceUri('media/icon.png');
      expect(uri.path).toContain('media/icon.png');
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors', () => {
      vi.mocked(vscode.window.createWebviewPanel).mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => new WebviewManager(mockContext)).toThrow('Test error');
    });

    it('should handle message sending errors', () => {
      const mockBridge = vi.mocked(WebviewBridge).mock.instances[0];
      vi.mocked(mockBridge.sendMessage).mockImplementation(() => {
        throw new Error('Send error');
      });

      expect(() => manager.sendMessage({ type: 'test', payload: {} })).toThrow('Send error');
    });
  });
}); 
 