/**
 * Type definitions for type-safety-hud
 */

/**
 * Represents analysis data for a single file
 */
export interface FileReport {
  /** Absolute path to the file */
  filePath: string;
  /** Relative path from the project root */
  relativePath: string;
  /** Number of 'any' type occurrences */
  anyCount: number;
  /** Number of '.js' imports */
  jsImportsCount: number;
  /** Status of the file's refactoring process */
  status: RefactorStatus;
  /** Priority level for refactoring */
  priority: PriorityLevel;
  /** Last time the file was modified */
  lastModified?: Date;
  /** Size of the file in bytes */
  fileSize?: number;
}

/**
 * Status of a file's refactoring
 */
export enum RefactorStatus {
  /** No refactoring started */
  Pending = 'pending',
  /** Partial refactoring completed */
  InProgress = 'in-progress',
  /** Refactoring completed */
  Completed = 'completed'
}

/**
 * Priority level for refactoring
 */
export enum PriorityLevel {
  /** Highest priority for refactoring */
  High = 'high',
  /** Medium priority for refactoring */
  Medium = 'medium',
  /** Low priority for refactoring */
  Low = 'low'
}

/**
 * Map of file paths to file reports
 */
export interface RefactorMap {
  /** Key is the absolute file path, value is the file report */
  [filePath: string]: FileReport;
}

/**
 * Statistics from the refactoring analysis
 */
export interface RefactorStats {
  /** Total number of files */
  totalFiles: number;
  /** Total files with 'any' types */
  filesWithAny: number;
  /** Total files with '.js' imports */
  filesWithJsImports: number;
  /** Percentage of files with 'any' types */
  anyPercentage: number;
  /** Percentage of files with '.js' imports */
  jsImportsPercentage: number;
  /** Files with completed refactoring */
  completed: number;
  /** Files with in-progress refactoring */
  inProgress: number;
  /** Files with pending refactoring */
  pending: number;
  /** Percentage of completed files */
  completedPercentage: number;
  /** Percentage of in-progress files */
  inProgressPercentage: number;
  /** Percentage of pending files */
  pendingPercentage: number;
  /** Number of high priority files */
  highPriority: number;
  /** Number of medium priority files */
  mediumPriority: number;
  /** Number of low priority files */
  lowPriority: number;
  /** Date of the analysis */
  timestamp: Date;
}

/**
 * Configuration options for the analyzer
 */
export interface AnalyzerOptions {
  /** Root directory to analyze */
  rootDir: string;
  /** Output directory for reports */
  outputDir?: string;
  /** Files or directories to exclude */
  exclude?: string[];
  /** Maximum number of files to analyze */
  maxFiles?: number;
  /** Path to store the YAML report */
  reportPath?: string;
  /** Path to store the trend file */
  trendPath?: string;
  /** Threshold for high priority (number of 'any' types) */
  highPriorityThreshold?: number;
  /** Threshold for medium priority (number of 'any' types) */
  mediumPriorityThreshold?: number;
  /** Whether to generate an HTML report */
  generateHtml?: boolean;
  /** Whether to include test files in the analysis */
  includeTests?: boolean;
  /** Custom path to TypeScript configuration */
  tsConfigPath?: string;
}

/**
 * Data point for trend tracking
 */
export interface TrendDataPoint {
  /** Date of the data point */
  date: string;
  /** Total files at this data point */
  totalFiles: number;
  /** Files with 'any' types at this data point */
  filesWithAny: number;
  /** Files with '.js' imports at this data point */
  filesWithJsImports: number;
  /** Percentage of completed files at this data point */
  completedPercentage: number;
}

/**
 * CLI command options
 */
export interface CommandOptions {
  /** Root directory to analyze */
  rootDir: string;
  /** Output directory for reports */
  outputDir: string;
  /** Whether to generate a report */
  report: boolean;
  /** Whether to update the trend file */
  trend: boolean;
  /** Whether to generate an HTML dashboard */
  html: boolean;
  /** Whether to output JSON data */
  json: boolean;
  /** Whether to run in verbose mode */
  verbose: boolean;
  /** Whether to rename .js imports to .ts */
  renameJsToTs: boolean;
  /** Path to the report file */
  reportPath: string;
  /** Path to the trend file */
  trendPath: string;
  /** Threshold for high priority */
  highPriorityThreshold: number;
  /** Threshold for medium priority */
  mediumPriorityThreshold: number;
  /** Whether to include test files */
  includeTests: boolean;
}

/**
 * Default configuration for the analyzer
 */
export const DEFAULT_CONFIG: CommandOptions = {
  rootDir: process.cwd(),
  outputDir: '.type-safety-hud',
  report: true,
  trend: true,
  html: false,
  json: false,
  verbose: false,
  renameJsToTs: false,
  reportPath: 'refactor-report.yml',
  trendPath: 'refactor-trend.md',
  highPriorityThreshold: 10,
  mediumPriorityThreshold: 5,
  includeTests: true
};

/**
 * Configuration options for type-safety-hud
 */
export interface TypeSafetyConfig {
  /**
   * Root directory to analyze
   */
  rootDir: string;
  
  /**
   * Files or directories to exclude
   */
  exclude?: string[];
  
  /**
   * Custom priority rules
   */
  priority?: {
    high?: { anyThreshold: number; jsImportThreshold: number };
    medium?: { anyThreshold: number; jsImportThreshold: number };
  };
  
  /**
   * Output paths
   */
  output?: {
    html?: string;
    trend?: string;
    map?: string;
  };
  
  /**
   * Dashboard configuration
   */
  dashboard?: {
    title?: string;
    theme?: 'light' | 'dark';
    logo?: string;
  };
}

/**
 * JSON output format
 */
export interface JsonOutput {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  anyTotal: number;
  jsImportsTotal: number;
  criticalFiles: {
    path: string;
    anyCount: number;
    jsImports: number;
    priority: PriorityLevel;
    status: RefactorStatus;
  }[];
} 