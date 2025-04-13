/**
 * File utility functions for type-safety-hud
 * Handles file operations, pattern matching, and path manipulation
 */

import fs from 'fs-extra';
import path from 'path';
import glob from 'glob-promise';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

/**
 * Finds TypeScript files recursively in a directory
 * @param directory - Base directory to search in
 * @param exclude - Patterns to exclude (node_modules is excluded by default)
 * @returns Array of file paths
 */
export async function findTypeScriptFiles(
  directory: string,
  exclude: string[] = ['node_modules/**', '**/dist/**', '**/build/**']
): Promise<string[]> {
  try {
    const pattern = '**/*.{ts,tsx}';
    const options = {
      cwd: directory,
      ignore: exclude,
      absolute: true,
      nodir: true,
    };
    
    return await glob(pattern, options);
  } catch (error) {
    throw new Error(`Failed to find TypeScript files: ${error}`);
  }
}

/**
 * Finds files containing .js imports using grep
 * @param directory - Base directory to search in
 * @returns Map of file paths to number of .js imports
 */
export async function findJsImports(directory: string): Promise<Map<string, number>> {
  try {
    const result = await exec(
      `grep -r --include="*.ts" --include="*.tsx" "from '\\.\\.\\/.*\\.js'" ${directory} | wc -l`
    );
    
    const fileMap = new Map<string, number>();
    
    // If no results, return empty map
    if (!result.stdout.trim()) {
      return fileMap;
    }
    
    // Parse the output and build the map
    const grepOutput = await exec(
      `grep -r --include="*.ts" --include="*.tsx" "from '\\.\\.\\/.*\\.js'" ${directory}`
    );
    
    const lines = grepOutput.stdout.trim().split('\n');
    
    lines.forEach(line => {
      const [filePath] = line.split(':');
      if (!filePath) return;
      
      const count = fileMap.get(filePath) || 0;
      fileMap.set(filePath, count + 1);
    });
    
    return fileMap;
  } catch (error) {
    // If grep returns non-zero (no matches), return empty map
    return new Map<string, number>();
  }
}

/**
 * Finds files containing 'any' type using grep
 * @param directory - Base directory to search in
 * @returns Map of file paths to number of 'any' occurrences
 */
export async function findAnyTypes(directory: string): Promise<Map<string, number>> {
  try {
    const result = await exec(
      `grep -r --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" "any" ${directory} | wc -l`
    );
    
    const fileMap = new Map<string, number>();
    
    // If no results, return empty map
    if (!result.stdout.trim()) {
      return fileMap;
    }
    
    // Parse the output and build the map
    const grepOutput = await exec(
      `grep -r --include="*.ts" --include="*.tsx" --exclude-dir="node_modules" "any" ${directory}`
    );
    
    const lines = grepOutput.stdout.trim().split('\n');
    
    lines.forEach(line => {
      const [filePath] = line.split(':');
      if (!filePath) return;
      
      const count = fileMap.get(filePath) || 0;
      fileMap.set(filePath, count + 1);
    });
    
    return fileMap;
  } catch (error) {
    // If grep returns non-zero (no matches), return empty map
    return new Map<string, number>();
  }
}

/**
 * Gets last modified date of a file
 * @param filePath - Path to the file
 * @returns Date object or null if file doesn't exist
 */
export async function getLastModifiedDate(filePath: string): Promise<Date | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  } catch (error) {
    return null;
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param directory - Path to the directory
 */
export async function ensureDirectory(directory: string): Promise<void> {
  await fs.ensureDir(directory);
}

/**
 * Reads a JSON file
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON content
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${error}`);
  }
}

/**
 * Writes data to a JSON file
 * @param filePath - Path to the JSON file
 * @param data - Data to write
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${error}`);
  }
}

/**
 * Copies a file
 * @param source - Source file path
 * @param destination - Destination file path
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  try {
    await fs.copy(source, destination);
  } catch (error) {
    throw new Error(`Failed to copy file from ${source} to ${destination}: ${error}`);
  }
}

/**
 * Generates relative path from an absolute path
 * @param absolutePath - Absolute file path
 * @param basePath - Base directory for relative paths
 * @returns Relative file path
 */
export function toRelativePath(absolutePath: string, basePath: string): string {
  return path.relative(basePath, absolutePath);
}

/**
 * Converts extension from .js to .ts for import statements
 * @param filePath - Path to the file to modify
 */
export async function convertJsImportsToTs(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Replace .js imports with .ts
    const updatedContent = content.replace(
      /from\s+['"](.*?)\.js['"]/g,
      'from \'$1.ts\''
    );
    
    // Only write if there were changes
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Failed to convert JS imports in ${filePath}: ${error}`);
    return false;
  }
}

/**
 * Counts occurrences of a pattern in a file
 * @param filePath - Path to the file
 * @param pattern - Regex pattern to search for
 * @returns Number of occurrences
 */
export async function countPattern(filePath: string, pattern: RegExp): Promise<number> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Gets the path of system temp directory
 * @returns Path to temp directory
 */
export function getTempDirectory(): string {
  return fs.realpathSync(os.tmpdir());
}

// Lazily import os module to avoid circular dependency
import os from 'os'; 