import { TypeSafetyDashboard } from './index';
import { TypeScriptAnalyzer } from './analyzers/typescript-analyzer';
import { FileReport, RefactorStatus } from './types';
import { HtmlReporter } from './reporters/html-reporter';
import * as path from 'path';

/**
 * Analyze a single TypeScript file
 * @param filePath Path to the TypeScript file
 * @returns Analysis results for the file
 */
export function analyzeFile(filePath: string): Promise<{
  filePath: string;
  anyCount: number;
  jsImportsCount: number;
  summary: string;
}> {
  return new Promise((resolve, reject) => {
    try {
      const analyzer = new TypeScriptAnalyzer();
      const result = analyzer.analyzeFile(filePath);
      
      resolve({
        filePath,
        anyCount: result.anyCount,
        jsImportsCount: result.jsImportsCount,
        summary: `Found ${result.anyCount} 'any' types and ${result.jsImportsCount} '.js' imports`
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Analyze an entire project
 * @param projectRoot Root directory of the project
 * @param options Optional configuration
 * @returns Project analysis report
 */
export function analyzeProject(projectRoot: string, options: {
  srcDir?: string;
  excludePatterns?: string[];
  includePatterns?: string[];
} = {}): Promise<{
  files: Record<string, FileReport>;
  filesCount: number;
  filesWithAnyCount: number;
  filesWithJsImportsCount: number;
  highPriorityCount: number;
  summary: string;
}> {
  return new Promise((resolve, reject) => {
    try {
      const srcDir = options.srcDir || path.join(projectRoot, 'src');
      
      const dashboard = new TypeSafetyDashboard({
        srcDir,
        excludePatterns: options.excludePatterns,
        includePatterns: options.includePatterns,
        verbose: false
      });
      
      const reportData = dashboard.runAnalysis();
      const { statistics, files } = reportData;
      
      resolve({
        files,
        filesCount: statistics.totalFiles,
        filesWithAnyCount: statistics.filesWithAny,
        filesWithJsImportsCount: statistics.filesWithJsImports,
        highPriorityCount: statistics.highPriorityCount,
        summary: `Analyzed ${statistics.totalFiles} files: ${statistics.filesWithAny} with 'any' types, ${statistics.filesWithJsImports} with '.js' imports`
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get critical files that need attention
 * @param projectRoot Root directory of the project
 * @param limit Maximum number of files to return
 * @returns Array of critical files
 */
export function getCriticalFiles(projectRoot: string, limit = 10): Promise<Array<{
  filePath: string;
  anyCount: number;
  jsImportsCount: number;
  priority: string;
}>> {
  return new Promise((resolve, reject) => {
    try {
      const dashboard = new TypeSafetyDashboard({
        srcDir: path.join(projectRoot, 'src'),
        verbose: false
      });
      
      dashboard.runAnalysis();
      const criticalFiles = dashboard.getCriticalFiles(limit);
      
      resolve(criticalFiles.map(([filePath, report]) => ({
        filePath,
        anyCount: report.anyCount,
        jsImportsCount: report.jsImportsCount,
        priority: ['LOW', 'MEDIUM', 'HIGH'][report.priority]
      })));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate HTML dashboard content based on analysis results
 * @param projectRoot Root directory of the project
 * @param options Optional configuration
 * @returns HTML content as a string
 */
export function generateHtmlDashboard(projectRoot: string, options: {
  srcDir?: string;
  excludePatterns?: string[];
  includePatterns?: string[];
} = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // First analyze the project
      analyzeProject(projectRoot, options)
        .then(report => {
          // Then generate HTML content
          const htmlReporter = new HtmlReporter();
          const refactorMap = report.files;
          
          // Create a simplified stats object based on the report
          const stats = {
            totalFiles: report.filesCount,
            filesWithAny: report.filesWithAnyCount,
            filesWithJsImports: report.filesWithJsImportsCount,
            highPriorityCount: report.highPriorityCount,
            completedCount: Object.values(refactorMap)
              .filter(file => file.status === RefactorStatus.COMPLETED).length,
            inProgressCount: Object.values(refactorMap)
              .filter(file => file.status === RefactorStatus.IN_PROGRESS).length,
            pendingCount: Object.values(refactorMap)
              .filter(file => file.status === RefactorStatus.PENDING).length,
            criticalFiles: Object.entries(refactorMap)
              .map(([filePath, file]) => ({
                filePath,
                anyCount: file.anyCount,
                jsImportsCount: file.jsImportsCount,
                priority: file.priority,
                status: file.status,
                notes: ''
              }))
              .sort((a, b) => b.priority - a.priority)
              .slice(0, 10),
            suggestions: [
              'Focus on high priority files first to make the most impact.',
              'Files with "any" types should be refactored to use proper TypeScript types.',
              'Replace .js imports with .ts imports where possible.'
            ]
          };
          
          htmlReporter.generateReport(refactorMap, stats)
            .then(html => resolve(html))
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    } catch (error) {
      reject(error);
    }
  });
} 