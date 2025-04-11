import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import * as vscode from "vscode";
import { activate, deactivate } from "./extension.js";
import { JarvisProvider } from "./core/webview/JarvisProvider.js";
import { TelemetryService } from "./services/TelemetryService.js";
import type { ApiConfiguration } from "./types/global.js";

vi.mock("vscode");
vi.mock("./core/webview/JarvisProvider");
vi.mock("./services/TelemetryService");

describe("Extension", () => {
  let context: vscode.ExtensionContext;
  let config: any;

  beforeEach(() => {
    context = {
      subscriptions: [],
      extensionPath: "/test/path",
      extensionUri: { fsPath: "/test/path" } as vscode.Uri,
      storageUri: { fsPath: "/test/storage" } as vscode.Uri,
      globalStorageUri: { fsPath: "/test/global-storage" } as vscode.Uri,
      logUri: { fsPath: "/test/log" } as vscode.Uri,
      extensionMode: vscode.ExtensionMode.Test,
      environmentVariableCollection: {} as vscode.EnvironmentVariableCollection,
      asAbsolutePath: (path: string) => path,
      storagePath: "/test/storage",
      globalStoragePath: "/test/global-storage",
      logPath: "/test/log",
    };

    config = {
      get: vi.fn((key: string) => {
        switch (key) {
          case "provider":
            return "openai";
          case "apiKey":
            return "test-api-key";
          case "telemetryApiKey":
            return "test-telemetry-key";
          case "telemetrySetting":
            return "enabled";
          default:
            return undefined;
        }
      }),
    };

    vi.spyOn(vscode.workspace, "getConfiguration").mockReturnValue(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("activate should initialize provider and telemetry service", async () => {
    await activate(context);

    expect(TelemetryService).toHaveBeenCalledWith("test-telemetry-key", "enabled");
    expect(JarvisProvider).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        provider: "openai",
        apiKey: "test-api-key",
      }),
      expect.any(TelemetryService)
    );
  });

  test("deactivate should dispose provider and shutdown telemetry", () => {
    const mockProvider = {
      dispose: vi.fn(),
    };
    const mockTelemetry = {
      shutdown: vi.fn(),
    };

    (JarvisProvider as any).mockImplementation(() => mockProvider);
    (TelemetryService as any).mockImplementation(() => mockTelemetry);

    activate(context);
    deactivate();

    expect(mockProvider.dispose).toHaveBeenCalled();
    expect(mockTelemetry.shutdown).toHaveBeenCalled();
  });

  test("configuration change should update provider config", async () => {
    const mockProvider = {
      updateConfig: vi.fn(),
    };

    (JarvisProvider as any).mockImplementation(() => mockProvider);

    await activate(context);

    const configChangeEvent = {
      affectsConfiguration: vi.fn((section) => section === "jarvis-ide"),
    };

    // Simulate configuration change
    config.get.mockImplementation((key: string) => {
      switch (key) {
        case "provider":
          return "bedrock";
        case "apiKey":
          return "new-api-key";
        default:
          return undefined;
      }
    });

    // Trigger configuration change event
    context.subscriptions
      .find((sub) => (sub as any).dispose.name === "onDidChangeConfiguration")
      ?.dispose(configChangeEvent);

    expect(mockProvider.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "bedrock",
        apiKey: "new-api-key",
      })
    );
  });
}); 