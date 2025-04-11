import * as vscode from 'vscode';
import type { HandlerFunction } from '../types.js';
import { readdir } from 'fs/promises';
import { join } from 'path';
import type { DirectoryScanArgs } from '../mcp.types.js';

interface DirectoryScanResult {
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryScanResult[];
}

async function scanDirectory(path: string, maxDepth: number = 3, exclude: string[] = []): Promise<DirectoryScanResult[]> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    const results: DirectoryScanResult[] = [];

    for (const entry of entries) {
      if (exclude.some(pattern => entry.name.match(pattern))) {
        continue;
      }

      const entryPath = join(path, entry.name);
      const result: DirectoryScanResult = {
        path: entryPath,
        type: entry.isDirectory() ? 'directory' : 'file'
      };

      if (entry.isDirectory() && maxDepth > 0) {
        result.children = await scanDirectory(entryPath, maxDepth - 1, exclude);
      }

      results.push(result);
    }

    return results;
  } catch (error) {
    console.error(`Error scanning directory ${path}:`, error);
    throw error;
  }
}

export const directoryScanner: HandlerFunction = async (args: DirectoryScanArgs) => {
  const { path, maxDepth = 3, exclude = ['.git', 'node_modules'] } = args;
  const recursive = args.recursive !== undefined ? args.recursive : (maxDepth !== 0);

  try {
    // Se recursive è false, usa maxDepth = 0, altrimenti usa il valore specificato
    const effectiveMaxDepth = recursive ? maxDepth : 0;
    
    const results = await scanDirectory(path, effectiveMaxDepth, exclude);
    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to scan directory: ${error.message}`
    };
  }
};