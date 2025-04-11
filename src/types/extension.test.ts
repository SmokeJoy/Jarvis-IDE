import { describe, expect, test } from "vitest";
import {
  ExtensionMessage,
  ExtensionCommand,
  ExtensionConfiguration,
  ExtensionState,
  ExtensionContext,
} from "./extension.js";

describe("Extension Types", () => {
  test("ExtensionMessage should have correct structure", () => {
    const message: ExtensionMessage = {
      type: "test",
      payload: { data: "test" },
    };
    expect(message).toMatchObject({
      type: expect.any(String),
      payload: expect.any(Object),
    });
  });

  test("ExtensionCommand should have correct structure", () => {
    const command: ExtensionCommand = {
      command: "test.command",
      title: "Test Command",
      category: "Test Category",
      when: "test-condition",
    };
    expect(command).toMatchObject({
      command: expect.any(String),
      title: expect.any(String),
      category: expect.any(String),
      when: expect.any(String),
    });
  });

  test("ExtensionConfiguration should have correct structure", () => {
    const config: ExtensionConfiguration = {
      api: {
        provider: "openai",
        apiKey: "test-key",
      },
      telemetry: {
        enabled: true,
        apiKey: "test-telemetry-key",
      },
      ui: {
        theme: "dark",
        fontSize: 14,
        fontFamily: "Consolas",
      },
    };
    expect(config).toMatchObject({
      api: expect.objectContaining({
        provider: expect.any(String),
        apiKey: expect.any(String),
      }),
      telemetry: expect.objectContaining({
        enabled: expect.any(Boolean),
        apiKey: expect.any(String),
      }),
      ui: expect.objectContaining({
        theme: expect.any(String),
        fontSize: expect.any(Number),
        fontFamily: expect.any(String),
      }),
    });
  });

  test("ExtensionState should have correct structure", () => {
    const state: ExtensionState = {
      messages: [],
      config: {
        api: {
          provider: "openai",
          apiKey: "test-key",
        },
        telemetry: {
          enabled: true,
        },
        ui: {
          theme: "dark",
          fontSize: 14,
          fontFamily: "Consolas",
        },
      },
      isLoading: false,
    };
    expect(state).toMatchObject({
      messages: expect.any(Array),
      config: expect.any(Object),
      isLoading: expect.any(Boolean),
    });
  });

  test("ExtensionContext should have correct structure", () => {
    const context: ExtensionContext = {
      extensionPath: "/test/path",
      subscriptions: [],
      workspaceState: {
        messages: [],
        config: {
          api: {
            provider: "openai",
            apiKey: "test-key",
          },
          telemetry: {
            enabled: true,
          },
          ui: {
            theme: "dark",
            fontSize: 14,
            fontFamily: "Consolas",
          },
        },
        isLoading: false,
      },
      globalState: {
        messages: [],
        config: {
          api: {
            provider: "openai",
            apiKey: "test-key",
          },
          telemetry: {
            enabled: true,
          },
          ui: {
            theme: "dark",
            fontSize: 14,
            fontFamily: "Consolas",
          },
        },
        isLoading: false,
      },
    };
    expect(context).toMatchObject({
      extensionPath: expect.any(String),
      subscriptions: expect.any(Array),
      workspaceState: expect.any(Object),
      globalState: expect.any(Object),
    });
  });
}); 