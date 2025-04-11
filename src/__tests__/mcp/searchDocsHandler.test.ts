import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
// src/__tests__/mcp/searchDocsHandler.test.ts
import { searchDocsHandler } from "../../services/mcp/handlers/searchDocsHandler";
import * as fs from "fs/promises";
import * as path from "path";

// Setup test content
const tempDir = path.resolve(__dirname, "../../temp");
const testFile = path.join(tempDir, "test_doc.md");

beforeAll(async () => {
  await fs.mkdir(tempDir, { recursive: true });
  await fs.writeFile(testFile, "Prima riga\nCerca qui\nUltima riga");
});

afterAll(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("searchDocsHandler", () => {
  it("should return matches from test file", async () => {
    const result = await searchDocsHandler({ query: "cerca", maxResults: 2 });
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
    expect(Array.isArray(result.output)).toBe(true);
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.output[0].snippet.toLowerCase()).toContain("cerca");
  });

  it("should fail if no query is provided", async () => {
    const result = await searchDocsHandler({ query: null });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/mancante/i);
  });
}); 