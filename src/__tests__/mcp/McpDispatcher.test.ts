import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpDispatcher } from "../../services/mcp/McpDispatcher";
import type { McpDispatcher as McpDispatcherType } from "../../services/mcp/McpDispatcher.js";

describe("McpDispatcher", () => {
  it("should return error for unknown tool", async () => {
    const sendResponse = vi.fn();
    const dispatcher = new McpDispatcher(sendResponse);

    await dispatcher.handleToolCall({
      requestId: "test-1",
      tool: "non_existent_tool",
      args: {},
    });

    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "llm.error",
        requestId: "test-1",
        payload: expect.objectContaining({
          error: expect.stringContaining("non supportato"),
        }),
      })
    );
  });
  
  // Questo test sarà commentato finché non potremo mockare vscode
  /* 
  it("should handle read_file tool call", async () => {
    const sendResponse = vi.fn();
    const dispatcher = new McpDispatcher(sendResponse);
    
    // Mock dell'handler
    vi.mock("../../services/mcp/handlers/readFileHandler", () => ({
      readFileHandler: vi.fn().mockResolvedValue("file content")
    }));

    await dispatcher.handleToolCall({
      requestId: "test-2",
      tool: "read_file",
      args: { path: "test.txt" },
    });

    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "llm.result",
        requestId: "test-2",
        payload: expect.objectContaining({
          result: "file content",
        }),
      })
    );
  });
  */
}); 