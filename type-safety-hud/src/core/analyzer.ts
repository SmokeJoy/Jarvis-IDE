/**
 * Project analyzer for type-safety-hud
 * Scans TypeScript files and identifies 'any' types and '.js' imports
 */

import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FileReport, RefactorMap, PriorityLevel } from '../types/index.js';

const execAsync = promisify(exec);

/**
 * Default priority thresholds
 */
const DEFAULT_PRIORITY = {
  high: { anyThreshold: 10, jsImportThreshold: 5 },
  medium: { anyThreshold: 3, jsImportThreshold: 2 },
};

/**
 * Analyzes a TypeScript project for type safety issues
 * @param projectDir - Path to the project root directory
 * @param options - Analysis options
 * @returns A RefactorMap with analysis results
 */
export async function analyzeProject(
  projectDir: string,
  options: {
    exclude?: string[];
    priority?: {
      high?: { anyThreshold: number; jsImportThreshold: number };
      medium?: { anyThreshold: number; jsImportThreshold: number };
    };
  } = {}
): Promise<RefactorMap> {
  const files = await findTypeScriptFiles(projectDir, options.exclude);
  const fileReports: FileReport[] = await Promise.all(
    files.map(file => analyzeFile(file, projectDir))
  );

  // Apply priorities
  const priorityRules = {
    high: {
      anyThreshold: options.priority?.high?.anyThreshold || DEFAULT_PRIORITY.high.anyThreshold,
      jsImportThreshold: options.priority?.high?.jsImportThreshold || DEFAULT_PRIORITY.high.jsImportThreshold,
    },
    medium: {
      anyThreshold: options.priority?.medium?.anyThreshold || DEFAULT_PRIORITY.medium.anyThreshold,
      jsImportThreshold: options.priority?.medium?.jsImportThreshold || DEFAULT_PRIORITY.medium.jsImportThreshold,
    },
  };

  for (const report of fileReports) {
    report.priority = determinePriority(report, priorityRules);
  }

  // Compute totals
  const totalAnyCount = fileReports.reduce((sum, file) => sum + file.anyCount, 0);
  const totalJsImports = fileReports.reduce((sum, file) => sum + file.jsImports, 0);

  return {
    files: fileReports,
    totalAnyCount,
    totalJsImports,
    generatedAt: new Date().toISOString(),
    version: getPackageVersion(),
  };
}

/**
 * Finds all TypeScript files in a directory
 * @param dir - Root directory to search
 * @param exclude - Patterns to exclude
 * @returns Array of file paths
 */
async function findTypeScriptFiles(dir: string, exclude: string[] = []): Promise<string[]> {
  try {
    const excludePattern = exclude.length > 0 
      ? `--exclude="${exclude.join(',')}"` 
      : '';
    
    // Use find command for better performance with large codebases
    const findCmd = process.platform === 'win32'
      ? `dir /s /b "${dir}\\*.ts" "${dir}\\*.tsx" | findstr /v "${exclude.join('|')}"`
      : `find "${dir}" -type f \\( -name "*.ts" -o -name "*.tsx" \\) ${excludePattern}`;
    
    const { stdout } = await execAsync(findCmd);
    return stdout.trim().split('\n').filter(Boolean);
  } catch (error) {
    // Fallback to manual recursive search
    return findTypeScriptFilesRecursive(dir, exclude);
  }
}

/**
 * Manually recurses through directories to find TypeScript files
 * @param dir - Root directory to search
 * @param exclude - Patterns to exclude
 * @returns Array of file paths
 */
function findTypeScriptFilesRecursive(
  dir: string, 
  exclude: string[] = [], 
  results: string[] = []
): string[] {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    // Check if file/dir should be excluded
    if (exclude.some(pattern => filePath.includes(pattern))) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTypeScriptFilesRecursive(filePath, exclude, results);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Analyzes a single TypeScript file
 * @param filePath - Path to the file
 * @param projectRoot - Project root for relative paths
 * @returns File report with analysis results
 */
async function analyzeFile(filePath: string, projectRoot: string): Promise<FileReport> {
  const fileContent = await fs.readFile(filePath, 'utf8');
  
  // Count occurrences of 'any' type
  const anyCount = countOccurrences(fileContent, /: any|as any/g);
  
  // Count .js imports
  const jsImports = countOccurrences(fileContent, /from ['"].*\.js['"]/g);
  
  // Get file stats
  const stats = await fs.stat(filePath);
  
  return {
    path: path.relative(projectRoot, filePath),
    anyCount,
    jsImports,
    status: 'pending', // Default status
    lastModified: stats.mtime.toISOString(),
  };
}

/**
 * Counts occurrences of a pattern in text
 * @param text - Text to search in
 * @param pattern - Regex pattern to match
 * @returns Number of occurrences
 */
function countOccurrences(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Determines priority level for a file based on analysis
 * @param file - File report
 * @param rules - Priority rules
 * @returns Priority level
 */
function determinePriority(
  file: FileReport,
  rules: {
    high: { anyThreshold: number; jsImportThreshold: number };
    medium: { anyThreshold: number; jsImportThreshold: number };
  }
): PriorityLevel {
  if (
    file.anyCount >= rules.high.anyThreshold || 
    file.jsImports >= rules.high.jsImportThreshold
  ) {
    return 'high';
  }
  
  if (
    file.anyCount >= rules.medium.anyThreshold || 
    file.jsImports >= rules.medium.jsImportThreshold
  ) {
    return 'medium';
  }
  
  if (file.anyCount > 0 || file.jsImports > 0) {
    return 'low';
  }
  
  return 'unknown';
}

/**
 * Gets the current package version
 * @returns Version string
 */
function getPackageVersion(): string {
  try {
    const packageJsonPath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../../package.json'
    );
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return '0.0.0';
  }
} 