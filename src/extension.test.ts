import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { activate, deactivate } from './extension';
import { JarvisProvider } from './core/webview/JarvisProvider';
import { TelemetryService } from './services/TelemetryService';
import { ApiConfiguration } from './types/global';

vi.mock('vscode');
vi.mock('./core/webview/JarvisProvider');
vi.mock('./services/TelemetryService');

// Interfaccia per la configurazione mock
interface MockConfiguration {
  get: (key: string) => unknown;
}

// Interfaccia per il provider mock
interface MockJarvisProvider {
  dispose?: () => void;
  updateConfig?: (config: ApiConfiguration) => void;
}

// Interfaccia per il servizio telemetria mock
interface MockTelemetryService {
  shutdown?: () => void;
}

describe('Extension', () => {
  let context: vscode.ExtensionContext;
  let config: MockConfiguration;

  beforeEach(() => {
    context = {
      subscriptions: [],
      extensionPath: '/test/path',
      extensionUri: { fsPath: '/test/path' } as vscode.Uri,
      storageUri: { fsPath: '/test/storage' } as vscode.Uri,
      globalStorageUri: { fsPath: '/test/global-storage' } as vscode.Uri,
      logUri: { fsPath: '/test/log' } as vscode.Uri,
      extensionMode: vscode.ExtensionMode.Test,
      environmentVariableCollection: {} as vscode.EnvironmentVariableCollection,
      asAbsolutePath: (path: string) => path,
      storagePath: '/test/storage',
      globalStoragePath: '/test/global-storage',
      logPath: '/test/log',
    };

    config = {
      get: vi.fn((key: string) => {
        switch (key) {
          case 'provider':
            return 'openai';
          case 'apiKey':
            return 'test-api-key';
          case 'telemetryApiKey':
            return 'test-telemetry-key';
          case 'telemetrySetting':
            return 'enabled';
          default:
            return undefined;
        }
      }),
    };

    vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(config as vscode.WorkspaceConfiguration);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('activate should initialize provider and telemetry service', async () => {
    await activate(context);

    expect(TelemetryService).toHaveBeenCalledWith('test-telemetry-key', 'enabled');
    expect(JarvisProvider).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        provider: 'openai',
        apiKey: 'test-api-key',
      }),
      expect.any(TelemetryService)
    );
  });

  test('deactivate should dispose provider and shutdown telemetry', () => {
    const mockProvider: MockJarvisProvider = {
      dispose: vi.fn(),
    };
    const mockTelemetry: MockTelemetryService = {
      shutdown: vi.fn(),
    };

    vi.mocked(JarvisProvider).mockImplementation(() => mockProvider as unknown as JarvisProvider);
    vi.mocked(TelemetryService).mockImplementation(() => mockTelemetry as unknown as TelemetryService);

    activate(context);
    deactivate();

    expect(mockProvider.dispose).toHaveBeenCalled();
    expect(mockTelemetry.shutdown).toHaveBeenCalled();
  });

  test('configuration change should update provider config', async () => {
    const mockProvider: MockJarvisProvider = {
      updateConfig: vi.fn(),
    };

    vi.mocked(JarvisProvider).mockImplementation(() => mockProvider as unknown as JarvisProvider);

    await activate(context);

    const configChangeEvent = {
      affectsConfiguration: vi.fn((section) => section === 'jarvis-ide'),
    };

    // Simulate configuration change
    (config.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'provider':
          return 'bedrock';
        case 'apiKey':
          return 'new-api-key';
        default:
          return undefined;
      }
    });

    // Trigger configuration change event
    const changeConfigSub = context.subscriptions.find(
      (sub) => 'dispose' in sub && typeof sub.dispose === 'function' && sub.dispose.name === 'onDidChangeConfiguration'
    );
    
    if (changeConfigSub && 'dispose' in changeConfigSub) {
      changeConfigSub.dispose(configChangeEvent as vscode.ConfigurationChangeEvent);
    }

    expect(mockProvider.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'bedrock',
        apiKey: 'new-api-key',
      })
    );
  });
});
