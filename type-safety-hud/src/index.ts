import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { TypeScriptAnalyzer } from './analyzers/typescript-analyzer';
import { 
  FileReport, 
  RefactorMap, 
  DashboardConfig, 
  ReportFile,
  RefactorStatistics,
  PriorityLevel,
  RefactorStatus,
  TrendDataPoint
} from './types';
import { generateMarkdownReport } from './reporters/markdown-reporter';

export class TypeSafetyDashboard {
  private config: DashboardConfig;
  private analyzer: TypeScriptAnalyzer;
  private reportData: ReportFile | null = null;
  
  constructor(config: DashboardConfig) {
    this.config = {
      srcDir: path.resolve(process.cwd(), config.srcDir || 'src'),
      reportFile: path.resolve(process.cwd(), config.reportFile || 'type-safety-report.yml'),
      trendFile: path.resolve(process.cwd(), config.trendFile || 'refactor-trend.md'),
      excludePatterns: config.excludePatterns || [],
      includePatterns: config.includePatterns || [],
      verbose: config.verbose || false
    };
    
    this.analyzer = new TypeScriptAnalyzer({
      excludePatterns: this.config.excludePatterns,
      includePatterns: this.config.includePatterns,
      verbose: this.config.verbose
    });
  }

  /**
   * Runs a full analysis of the project
   * @returns The analysis report data
   */
  public runAnalysis(): ReportFile {
    if (this.config.verbose) {
      console.log(`Analyzing project in ${this.config.srcDir}...`);
    }
    
    const startTime = new Date();
    const fileReports: RefactorMap = this.analyzer.walkAndAnalyze(this.config.srcDir);
    const endTime = new Date();
    
    const statistics = this.calculateStatistics(fileReports);
    
    this.reportData = {
      timestamp: new Date().toISOString(),
      elapsedTimeMs: endTime.getTime() - startTime.getTime(),
      statistics,
      files: fileReports
    };
    
    return this.reportData;
  }

  /**
   * Loads an existing report from file
   * @returns The loaded report data
   */
  public loadReport(): ReportFile | null {
    if (!fs.existsSync(this.config.reportFile)) {
      if (this.config.verbose) {
        console.log(`Report file ${this.config.reportFile} not found.`);
      }
      return null;
    }
    
    try {
      const fileContent = fs.readFileSync(this.config.reportFile, 'utf-8');
      this.reportData = yaml.load(fileContent) as ReportFile;
      return this.reportData;
    } catch (error) {
      console.error(`Error loading report file: ${error}`);
      return null;
    }
  }

  /**
   * Saves the current report data to file
   */
  public saveReport(): void {
    if (!this.reportData) {
      throw new Error('No report data available. Run analysis first.');
    }
    
    const yamlContent = yaml.dump(this.reportData);
    fs.writeFileSync(this.config.reportFile, yamlContent, 'utf-8');
    
    if (this.config.verbose) {
      console.log(`Report saved to ${this.config.reportFile}`);
    }
  }

  /**
   * Updates the trend file with the latest statistics
   */
  public updateTrendFile(): void {
    if (!this.reportData) {
      throw new Error('No report data available. Run analysis first.');
    }
    
    const { statistics } = this.reportData;
    const timestamp = new Date().toISOString();
    
    const newDataPoint: TrendDataPoint = {
      timestamp,
      totalFiles: statistics.totalFiles,
      filesWithAny: statistics.filesWithAny,
      filesWithJsImports: statistics.filesWithJsImports,
      completed: statistics.completedCount,
      inProgress: statistics.inProgressCount,
      pending: statistics.pendingCount
    };
    
    let trendData: TrendDataPoint[] = [];
    
    // Load existing trend data if available
    if (fs.existsSync(this.config.trendFile)) {
      try {
        const content = fs.readFileSync(this.config.trendFile, 'utf-8');
        const match = content.match(/```json\n([\s\S]*?)\n```/);
        
        if (match && match[1]) {
          trendData = JSON.parse(match[1]);
        }
      } catch (error) {
        console.error(`Error loading trend data: ${error}`);
      }
    }
    
    // Add new data point
    trendData.push(newDataPoint);
    
    // Generate markdown with embedded JSON
    const markdownContent = this.generateTrendMarkdown(trendData);
    fs.writeFileSync(this.config.trendFile, markdownContent, 'utf-8');
    
    if (this.config.verbose) {
      console.log(`Trend file updated at ${this.config.trendFile}`);
    }
  }

  /**
   * Generates a markdown report
   * @returns Markdown content
   */
  public generateReport(): string {
    if (!this.reportData) {
      throw new Error('No report data available. Run analysis first.');
    }
    
    return generateMarkdownReport(this.reportData);
  }

  /**
   * Gets the critical files that need attention
   * @param limit Maximum number of files to return
   * @returns Array of file paths and their reports, sorted by priority
   */
  public getCriticalFiles(limit: number = 10): Array<[string, FileReport]> {
    if (!this.reportData) {
      throw new Error('No report data available. Run analysis first.');
    }
    
    return Object.entries(this.reportData.files)
      .filter(([_, report]) => report.status !== RefactorStatus.COMPLETED)
      .sort((a, b) => {
        // Sort by priority first (HIGH > MEDIUM > LOW)
        if (a[1].priority !== b[1].priority) {
          return b[1].priority - a[1].priority;
        }
        
        // Then by combined count of any and JS imports
        const aCount = a[1].anyCount + a[1].jsImportsCount;
        const bCount = b[1].anyCount + b[1].jsImportsCount;
        return bCount - aCount;
      })
      .slice(0, limit);
  }

  /**
   * Calculates statistics based on file reports
   * @param files Map of file reports
   * @returns Statistics object
   */
  private calculateStatistics(files: RefactorMap): RefactorStatistics {
    const fileEntries = Object.entries(files);
    const totalFiles = fileEntries.length;
    
    const filesWithAny = fileEntries.filter(([_, report]) => report.anyCount > 0).length;
    const filesWithJsImports = fileEntries.filter(([_, report]) => report.jsImportsCount > 0).length;
    
    const completedCount = fileEntries.filter(([_, report]) => report.status === RefactorStatus.COMPLETED).length;
    const inProgressCount = fileEntries.filter(([_, report]) => report.status === RefactorStatus.IN_PROGRESS).length;
    const pendingCount = fileEntries.filter(([_, report]) => report.status === RefactorStatus.PENDING).length;
    
    const highPriorityCount = fileEntries.filter(([_, report]) => report.priority === PriorityLevel.HIGH).length;
    const mediumPriorityCount = fileEntries.filter(([_, report]) => report.priority === PriorityLevel.MEDIUM).length;
    const lowPriorityCount = fileEntries.filter(([_, report]) => report.priority === PriorityLevel.LOW).length;
    
    return {
      totalFiles,
      filesWithAny,
      filesWithJsImports,
      completedCount,
      inProgressCount,
      pendingCount,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
      anyPercentage: totalFiles > 0 ? (filesWithAny / totalFiles) * 100 : 0,
      jsImportsPercentage: totalFiles > 0 ? (filesWithJsImports / totalFiles) * 100 : 0,
      completedPercentage: totalFiles > 0 ? (completedCount / totalFiles) * 100 : 0
    };
  }

  /**
   * Generates markdown content for the trend file
   * @param trendData Array of trend data points
   * @returns Markdown content
   */
  private generateTrendMarkdown(trendData: TrendDataPoint[]): string {
    return `# TypeScript Refactoring Trends

This file tracks the progress of the TypeScript refactoring effort over time.

## Data

\`\`\`json
${JSON.stringify(trendData, null, 2)}
\`\`\`

## Chart

Last updated: ${new Date().toLocaleString()}

|  Date  | Total Files | Files with 'any' | % | Files with JS imports | % | Completed | % |
|--------|-------------|------------------|---|----------------------|---|-----------|---|
${trendData.map(point => {
  const date = new Date(point.timestamp).toLocaleDateString();
  const anyPercent = point.totalFiles > 0 
    ? ((point.filesWithAny / point.totalFiles) * 100).toFixed(1) 
    : '0.0';
  const jsPercent = point.totalFiles > 0 
    ? ((point.filesWithJsImports / point.totalFiles) * 100).toFixed(1) 
    : '0.0';
  const completedPercent = point.totalFiles > 0 
    ? ((point.completed / point.totalFiles) * 100).toFixed(1) 
    : '0.0';
    
  return `| ${date} | ${point.totalFiles} | ${point.filesWithAny} | ${anyPercent}% | ${point.filesWithJsImports} | ${jsPercent}% | ${point.completed} | ${completedPercent}% |`;
}).join('\n')}
`;
  }
}

// Export types for external use
export * from './types';
export * from './analyzers/typescript-analyzer';
export * from './reporters/markdown-reporter';

// Export API functions
export * from './api'; 