import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import * as vscode from "vscode";
import { FileManager } from "../core/file-operations/FileManager.js.js";

vi.mock("vscode");

describe("FileManager", () => {
  let fileManager: FileManager;
  let workspaceState: any;

  beforeEach(() => {
    workspaceState = {
      get: vi.fn(),
      update: vi.fn(),
    };

    const context = {
      workspaceState,
    } as any;

    fileManager = new FileManager(context);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("should create file", async () => {
    const filePath = "test.txt";
    const content = "test content";

    await fileManager.createFile(filePath, content);
    expect(vscode.workspace.getConfiguration).toHaveBeenCalled();
  });

  test("should delete file", async () => {
    const filePath = "test.txt";

    await fileManager.deleteFile(filePath);
    expect(vscode.workspace.getConfiguration).toHaveBeenCalled();
  });
}); 