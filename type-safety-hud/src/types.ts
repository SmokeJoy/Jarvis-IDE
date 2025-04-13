/**
 * Type definitions for type-safety-hud
 */

/**
 * Represents the priority level of a file for refactoring
 */
export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Represents the status of a file in the refactoring process
 */
export type RefactorStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

/**
 * Represents a report for a single file
 */
export interface FileReport {
  /**
   * Number of 'any' type occurrences in the file
   */
  anyCount: number;
  
  /**
   * Number of JS imports in the file
   */
  jsImportsCount: number;
  
  /**
   * Priority level for refactoring
   */
  priority: PriorityLevel;
  
  /**
   * Status of the refactoring process
   */
  status: RefactorStatus;
  
  /**
   * Last time the file was analyzed
   */
  lastAnalyzed: string;
}

/**
 * Map of file paths to their reports
 */
export type RefactorMap = Record<string, FileReport>;

/**
 * Statistics about the refactoring process
 */
export interface RefactorStatistics {
  /**
   * Total number of files analyzed
   */
  totalFiles: number;
  
  /**
   * Number of files with 'any' types
   */
  filesWithAnyCount: number;
  
  /**
   * Percentage of files with 'any' types
   */
  filesWithAnyPercentage: number;
  
  /**
   * Number of files with JS imports
   */
  filesWithJsImportsCount: number;
  
  /**
   * Percentage of files with JS imports
   */
  filesWithJsImportsPercentage: number;
  
  /**
   * Total count of 'any' types across all files
   */
  totalAnyCount: number;
  
  /**
   * Total count of JS imports across all files
   */
  totalJsImportsCount: number;
  
  /**
   * Number of files that have been refactored
   */
  completedCount: number;
  
  /**
   * Percentage of files that have been refactored
   */
  completedPercentage: number;
  
  /**
   * Number of files that are in progress
   */
  inProgressCount: number;
  
  /**
   * Percentage of files that are in progress
   */
  inProgressPercentage: number;
  
  /**
   * Number of files that are pending refactoring
   */
  pendingCount: number;
  
  /**
   * Percentage of files that are pending refactoring
   */
  pendingPercentage: number;
  
  /**
   * Number of high priority files
   */
  highPriorityCount: number;
  
  /**
   * Number of medium priority files
   */
  mediumPriorityCount: number;
  
  /**
   * Number of low priority files
   */
  lowPriorityCount: number;
  
  /**
   * Most critical file that needs attention
   */
  topCriticalFile: {
    filePath: string;
    anyCount: number;
    jsImportsCount: number;
    priority: PriorityLevel;
    status: RefactorStatus;
    lastAnalyzed: string;
  } | null;
}

/**
 * Full report file structure
 */
export interface ReportFile {
  /**
   * Timestamp of when the report was generated
   */
  timestamp: string;
  
  /**
   * Time taken to generate the report in milliseconds
   */
  elapsedTimeMs: number;
  
  /**
   * Statistics about the refactoring process
   */
  statistics: RefactorStatistics;
  
  /**
   * Map of file paths to their reports
   */
  files: RefactorMap;
}

/**
 * Configuration for the TypeScript analyzer
 */
export interface AnalyzerConfig {
  /**
   * Root directory to analyze
   */
  rootDir: string;
  
  /**
   * Patterns to exclude from analysis
   */
  excludePatterns?: string[];
  
  /**
   * Patterns to include in analysis
   */
  includePatterns?: string[];
  
  /**
   * Threshold for high priority files
   */
  highPriorityThreshold?: number;
  
  /**
   * Threshold for medium priority files
   */
  mediumPriorityThreshold?: number;
  
  /**
   * Whether to log verbose output
   */
  verbose?: boolean;
}

/**
 * Configuration for the dashboard
 */
export interface DashboardConfig {
  /**
   * Source directory to analyze
   */
  srcDir: string;
  
  /**
   * Path to the report file
   */
  reportPath: string;
  
  /**
   * Path to the trend file
   */
  trendPath: string;
  
  /**
   * Patterns to exclude from analysis
   */
  excludePatterns: string[];
  
  /**
   * Patterns to include in analysis
   */
  includePatterns: string[];
  
  /**
   * Threshold for high priority files
   */
  highPriorityThreshold: number;
  
  /**
   * Threshold for medium priority files
   */
  mediumPriorityThreshold: number;
}

/**
 * Represents a data point in the trend data
 */
export interface TrendDataPoint {
  /**
   * Date of the data point
   */
  date: string;
  
  /**
   * Total number of files analyzed
   */
  totalFiles: number;
  
  /**
   * Number of files with 'any' types
   */
  filesWithAny: number;
  
  /**
   * Number of files with JS imports
   */
  filesWithJsImports: number;
  
  /**
   * Total count of 'any' types across all files
   */
  totalAnyCount: number;
  
  /**
   * Total count of JS imports across all files
   */
  totalJsImports: number;
  
  /**
   * Number of files that have been refactored
   */
  completed: number;
  
  /**
   * Number of files that are in progress
   */
  inProgress: number;
  
  /**
   * Number of files that are pending refactoring
   */
  pending: number;
}

/**
 * Trend data structure
 */
export interface TrendData {
  /**
   * Array of data points
   */
  points: TrendDataPoint[];
  
  /**
   * Timestamp of last update
   */
  lastUpdated: string;
}

/**
 * Options for the analyzer
 */
export interface AnalyzerOptions {
  rootDir: string;
  exclude: string[];
  includeTests: boolean;
  highPriorityThreshold: number;
  mediumPriorityThreshold: number;
  verbose: boolean;
}

/**
 * Options for the reporter
 */
export interface ReporterOptions {
  reportPath: string;
  trendPath: string;
  format: 'json' | 'yaml' | 'markdown';
  verbose: boolean;
}

/**
 * Options for the dashboard
 */
export interface DashboardOptions {
  reportPath: string;
  trendPath: string;
  outputPath: string;
  templatePath?: string;
  openBrowser: boolean;
  verbose: boolean;
}

/**
 * Options for renaming .js imports
 */
export interface RenameOptions {
  rootDir: string;
  dryRun: boolean;
  verbose: boolean;
}

/**
 * Result of a rename operation
 */
export interface RenameResult {
  filePath: string;
  relativePath: string;
  replacements: number;
  success: boolean;
  error?: string;
}

/**
 * Summary of rename operation results
 */
export interface RenameReport {
  totalFiles: number;
  filesModified: number;
  totalReplacements: number;
  errors: number;
  timestamp: string;
}

/**
 * Options for file analysis
 */
export interface AnalysisOptions {
  excludePatterns?: string[];
  includePatterns?: string[];
  verbose?: boolean;
}

/**
 * Aggregated statistics about refactoring status
 */
export interface RefactorStats {
  totalFiles: number;
  filesWithAny: number;
  filesWithJsImports: number;
  completed: number;
  inProgress: number;
  pending: number;
  error: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  topCriticalFiles: FileReport[];
  totalAnyCount: number;
  totalJsImports: number;
  timestamp: string;
}

/**
 * Historical data point for trend tracking
 */
export interface TrendDataPoint {
  date: string;
  totalFiles: number;
  filesWithAny: number;
  filesWithJsImports: number;
  totalAnyCount: number;
  totalJsImports: number;
  completed: number;
  inProgress: number;
  pending: number;
}

/**
 * Trend data containing historical data points
 */
export interface TrendData {
  points: TrendDataPoint[];
  lastUpdated: string;
}

/**
 * Options for the analyzer
 */
export interface AnalyzerOptions {
  rootDir: string;
  exclude: string[];
  includeTests: boolean;
  highPriorityThreshold: number;
  mediumPriorityThreshold: number;
  verbose: boolean;
}

/**
 * Options for the reporter
 */
export interface ReporterOptions {
  reportPath: string;
  trendPath: string;
  format: 'json' | 'yaml' | 'markdown';
  verbose: boolean;
}

/**
 * Options for the dashboard
 */
export interface DashboardOptions {
  reportPath: string;
  trendPath: string;
  outputPath: string;
  templatePath?: string;
  openBrowser: boolean;
  verbose: boolean;
}

/**
 * Options for renaming .js imports
 */
export interface RenameOptions {
  rootDir: string;
  dryRun: boolean;
  verbose: boolean;
}

/**
 * Result of a rename operation
 */
export interface RenameResult {
  filePath: string;
  relativePath: string;
  replacements: number;
  success: boolean;
  error?: string;
}

/**
 * Summary of rename operation results
 */
export interface RenameReport {
  totalFiles: number;
  filesModified: number;
  totalReplacements: number;
  errors: number;
  timestamp: string;
}

/**
 * Options for file analysis
 */
export interface AnalysisOptions {
  excludePatterns?: string[];
  includePatterns?: string[];
  verbose?: boolean;
}

/**
 * Configuration for the dashboard
 */
export interface DashboardConfig {
  // Directories
  srcDir: string;
  reportPath: string;
  trendPath: string;
  
  // Analysis settings
  excludePatterns: string[];
  includePatterns: string[];
  
  // Priority threshold settings
  highPriorityThreshold: number;
  mediumPriorityThreshold: number;
} 