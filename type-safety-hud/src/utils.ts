/**
 * Utility functions for Type Safety HUD
 * Provides common functionality for the type safety dashboard
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { RefactorMap, RefactorStatus, FileReport, RefactorStatistics } from './types';

/**
 * Loads a refactor map from a YAML file
 */
export async function loadRefactorMap(filePath: string): Promise<RefactorMap> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return yaml.load(fileContent) as RefactorMap || {};
  } catch (error) {
    console.error(`Error loading refactor map from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Saves a refactor map to a YAML file
 */
export async function saveRefactorMap(filePath: string, refactorMap: RefactorMap): Promise<void> {
  try {
    // Ensure the directory exists
    await fs.ensureDir(path.dirname(filePath));
    
    const yamlContent = yaml.dump(refactorMap, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
    
    await fs.writeFile(filePath, yamlContent, 'utf8');
  } catch (error) {
    console.error(`Error saving refactor map to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Calculates statistics from a refactor map
 */
export function calculateStats(refactorMap: RefactorMap): RefactorStatistics {
  const files = Object.entries(refactorMap).map(([filePath, report]) => ({ filePath, report }));
  
  const totalFiles = files.length;
  const filesWithAny = files.filter(({ report }) => report.anyCount > 0).length;
  const filesWithJsImports = files.filter(({ report }) => report.jsImportsCount > 0).length;
  
  const completed = files.filter(({ report }) => report.status === RefactorStatus.COMPLETED).length;
  const inProgress = files.filter(({ report }) => report.status === RefactorStatus.IN_PROGRESS).length;
  const pending = files.filter(({ report }) => report.status === RefactorStatus.PENDING).length;
  
  const highPriority = files.filter(({ report }) => report.priority === 0).length;
  const mediumPriority = files.filter(({ report }) => report.priority === 1).length;
  const lowPriority = files.filter(({ report }) => report.priority === 2).length;
  
  // Sort critical files by priority, then by total issues
  const criticalFiles = [...files]
    .sort((a, b) => {
      // Sort by priority first
      if (a.report.priority !== b.report.priority) {
        return a.report.priority - b.report.priority;
      }
      
      // Then by total issues
      const aIssues = a.report.anyCount + a.report.jsImportsCount;
      const bIssues = b.report.anyCount + b.report.jsImportsCount;
      return bIssues - aIssues;
    })
    .filter(({ report }) => report.status !== RefactorStatus.COMPLETED)
    .slice(0, 10);  // Top 10 critical files
  
  return {
    totalFiles,
    filesWithAny,
    filesWithJsImports,
    completed,
    inProgress,
    pending,
    highPriority,
    mediumPriority,
    lowPriority,
    criticalFiles
  };
}

/**
 * Generates suggestions based on the refactor map and statistics
 */
export function generateSuggestions(refactorMap: RefactorMap, stats: RefactorStatistics): string[] {
  const suggestions: string[] = [];
  
  // Suggestion based on overall progress
  const percentComplete = (stats.completed / stats.totalFiles) * 100;
  if (percentComplete < 25) {
    suggestions.push("Focus on high priority files first to make the most impact.");
  } else if (percentComplete < 75) {
    suggestions.push("Good progress! Continue working on medium priority files.");
  } else {
    suggestions.push("Almost there! Only a few files left to refactor.");
  }
  
  // Suggestion based on file types
  if (stats.highPriority > 0) {
    suggestions.push(`Address the ${stats.highPriority} high priority files to significantly improve type safety.`);
  } else if (stats.mediumPriority > 0) {
    suggestions.push(`Focus on the ${stats.mediumPriority} medium priority files to continue progress.`);
  } else if (stats.lowPriority > 0) {
    suggestions.push("Only low priority files remain. Good job on addressing the critical issues!");
  }
  
  // Suggestion for specific files
  if (stats.criticalFiles.length > 0) {
    const topFile = stats.criticalFiles[0];
    suggestions.push(`Consider working on "${topFile.filePath}" next, which has ${topFile.report.anyCount} 'any' types and ${topFile.report.jsImportsCount} JS imports.`);
  }
  
  // Suggestion for files in progress
  if (stats.inProgress > 0) {
    suggestions.push(`You have ${stats.inProgress} files in progress. Consider completing these before starting on new files.`);
  }
  
  return suggestions;
}

/**
 * Formats a percentage with proper rounding
 */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

/**
 * Shortens a file path for display
 */
export function shortenPath(filePath: string, maxLength: number = 50): string {
  if (filePath.length <= maxLength) return filePath;
  
  const parts = filePath.split(path.sep);
  let result = parts[parts.length - 1];
  let index = parts.length - 2;
  
  while (index >= 0 && `...${path.sep}${result}`.length < maxLength) {
    result = `${parts[index]}${path.sep}${result}`;
    index--;
  }
  
  return `...${path.sep}${result}`;
}

/**
 * Gets a date string in YYYY-MM-DD format for the current date
 */
export function getDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Gets a formatted timestamp for display
 */
export function getFormattedTimestamp(): string {
  const now = new Date();
  return now.toLocaleString();
}

/**
 * Gets a CSS color class based on the priority
 */
export function getPriorityColorClass(priority: number): string {
  switch (priority) {
    case 0: return 'priority-high';
    case 1: return 'priority-medium';
    case 2: return 'priority-low';
    default: return 'priority-unknown';
  }
}

/**
 * Gets a CSS color class based on the status
 */
export function getStatusColorClass(status: RefactorStatus): string {
  switch (status) {
    case RefactorStatus.COMPLETED: return 'status-completed';
    case RefactorStatus.IN_PROGRESS: return 'status-in-progress';
    case RefactorStatus.PENDING: return 'status-pending';
    default: return 'status-unknown';
  }
}

/**
 * Gets a human-readable priority text
 */
export function getPriorityText(priority: number): string {
  switch (priority) {
    case 0: return 'High';
    case 1: return 'Medium';
    case 2: return 'Low';
    default: return 'Unknown';
  }
}

/**
 * Gets a human-readable status text
 */
export function getStatusText(status: RefactorStatus): string {
  switch (status) {
    case RefactorStatus.COMPLETED: return 'Completed';
    case RefactorStatus.IN_PROGRESS: return 'In Progress';
    case RefactorStatus.PENDING: return 'Pending';
    default: return 'Unknown';
  }
}

/**
 * Formats a date as YYYY/MM/DD, HH:MM:SS
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Makes a file path relative to the root directory
 */
export function makeRelativePath(filePath: string, rootDir: string): string {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

/**
 * Checks if a file should be excluded based on patterns
 */
export function shouldExcludeFile(filePath: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    if (pattern.startsWith('**/')) {
      return filePath.includes(pattern.slice(3));
    }
    return filePath.includes(pattern);
  });
}

/**
 * Gets file stats including size and last modified date
 */
export function getFileStats(filePath: string): { size: number; lastModified: string } {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      lastModified: formatDate(stats.mtime),
    };
  } catch (error) {
    return {
      size: 0,
      lastModified: formatDate(),
    };
  }
}

/**
 * Calculates priority level based on any count and js imports count
 */
export function calculatePriority(
  anyCount: number,
  jsImportsCount: number,
  highThreshold: number,
  mediumThreshold: number
): PriorityLevel {
  const total = anyCount + jsImportsCount;
  
  if (total >= highThreshold) {
    return PriorityLevel.High;
  } else if (total >= mediumThreshold) {
    return PriorityLevel.Medium;
  }
  
  return PriorityLevel.Low;
}

/**
 * Gets status description as a string
 */
export function getStatusDescription(status: RefactorStatus): string {
  switch (status) {
    case RefactorStatus.Pending:
      return 'Pending';
    case RefactorStatus.InProgress:
      return 'In Progress';
    case RefactorStatus.Completed:
      return 'Completed';
    case RefactorStatus.Error:
      return 'Error';
    default:
      return 'Unknown';
  }
}

/**
 * Gets priority description as a string
 */
export function getPriorityDescription(priority: PriorityLevel): string {
  switch (priority) {
    case PriorityLevel.High:
      return 'High';
    case PriorityLevel.Medium:
      return 'Medium';
    case PriorityLevel.Low:
      return 'Low';
    default:
      return 'Unknown';
  }
}

/**
 * Creates default file report
 */
export function createErrorFileReport(filePath: string, rootDir: string, error: string): FileReport {
  const relativePath = makeRelativePath(filePath, rootDir);
  const { size, lastModified } = getFileStats(filePath);
  
  return {
    filePath,
    relativePath,
    anyCount: 0,
    jsImportsCount: 0,
    status: RefactorStatus.Error,
    priority: PriorityLevel.Low,
    fileSize: size,
    lastModified,
    error,
  };
}

/**
 * Ensures a directory exists
 */
export function ensureDirectoryExists(dirPath: string): void {
  fs.ensureDirSync(dirPath);
}

/**
 * Returns a percentage string from a fraction
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0.0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

/**
 * Helper to log verbose information
 */
export function logVerbose(message: string, verbose: boolean): void {
  if (verbose) {
    console.log(message);
  }
} 