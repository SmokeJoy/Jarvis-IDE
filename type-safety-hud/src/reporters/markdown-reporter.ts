/**
 * Markdown Reporter Module
 * Generates Markdown reports for type safety analysis
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { RefactorMap, RefactorStats, FileReport, PriorityLevel, RefactorStatus } from '../types';
import { logVerbose, formatDate } from '../utils';

/**
 * Generates a Markdown report from the refactor map
 */
export async function generateReport(
  reportPath: string,
  refactorMap: RefactorMap,
  stats: RefactorStats,
  verbose = false
): Promise<void> {
  try {
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    await fs.ensureDir(reportDir);
    
    // Generate markdown content
    let markdown = '# Type Safety Refactoring Dashboard\n\n';
    
    // Add timestamp
    markdown += `Last updated on: ${formatDate(new Date())}\n\n`;
    
    // Add statistics section
    markdown += '## Statistics\n\n';
    markdown += `- Total files analyzed: ${stats.totalFiles}\n`;
    markdown += `- Files with 'any' types: ${stats.filesWithAny} (${getPercentage(stats.filesWithAny, stats.totalFiles)}%)\n`;
    markdown += `- Files with '.js' imports: ${stats.filesWithJsImports} (${getPercentage(stats.filesWithJsImports, stats.totalFiles)}%)\n`;
    markdown += `- Total 'any' types: ${stats.totalAnyCount}\n`;
    markdown += `- Total '.js' imports: ${stats.totalJsImports}\n\n`;
    
    // Add progress section
    markdown += '## Progress\n\n';
    markdown += `- Completed: ${stats.completed} (${getPercentage(stats.completed, stats.totalFiles)}%)\n`;
    markdown += `- In Progress: ${stats.inProgress} (${getPercentage(stats.inProgress, stats.totalFiles)}%)\n`;
    markdown += `- Pending: ${stats.pending} (${getPercentage(stats.pending, stats.totalFiles)}%)\n\n`;
    
    // Add priority section
    markdown += '## Priority\n\n';
    markdown += `- High priority files: ${stats.highPriority}\n`;
    markdown += `- Medium priority files: ${stats.mediumPriority}\n`;
    markdown += `- Low priority files: ${stats.lowPriority}\n\n`;
    
    // Add critical files section
    markdown += '## Top Critical Files\n\n';
    
    const criticalFiles = getSortedCriticalFiles(refactorMap, 10);
    
    if (criticalFiles.length === 0) {
      markdown += 'No critical files found.\n\n';
    } else {
      markdown += '| File Path | Any Types | JS Imports | Priority | Status |\n';
      markdown += '|-----------|-----------|------------|----------|--------|\n';
      
      for (const { filePath, report } of criticalFiles) {
        markdown += `| ${filePath} | ${report.anyCount} | ${report.jsImportsCount} | ${getPriorityText(report.priority)} | ${getStatusText(report.status)} |\n`;
      }
      
      markdown += '\n';
    }
    
    // Add suggestions
    markdown += '## Suggestions\n\n';
    
    if (stats.highPriority > 0) {
      markdown += '🔴 Focus on high priority files first to make the most impact.\n';
    } else if (stats.mediumPriority > 0) {
      markdown += '🟠 Good progress! Continue with medium priority files.\n';
    } else if (stats.lowPriority > 0) {
      markdown += '🟢 Only low priority files remain. You\'re almost there!\n';
    } else {
      markdown += '✅ Congratulations! All files have been refactored.\n';
    }
    
    markdown += '\n';
    
    // Write to file
    await fs.writeFile(reportPath, markdown, 'utf8');
    
    logVerbose(`Generated Markdown report at ${reportPath}`, verbose);
    
  } catch (error) {
    console.error(`Error generating Markdown report: ${error}`);
    throw error;
  }
}

/**
 * Generates a trend file in Markdown format
 */
export async function generateTrendReport(
  trendPath: string,
  trendData: Array<{ date: string; stats: RefactorStats }>,
  verbose = false
): Promise<void> {
  try {
    // Ensure directory exists
    const trendDir = path.dirname(trendPath);
    await fs.ensureDir(trendDir);
    
    // Generate markdown content
    let markdown = '# Type Safety Refactoring Trend\n\n';
    
    // Add timestamp
    markdown += `Last updated on: ${formatDate(new Date())}\n\n`;
    
    // Generate trend chart
    markdown += '## Historical Trend\n\n';
    
    if (trendData.length === 0) {
      markdown += 'No trend data available yet.\n\n';
    } else {
      // Create a simple ASCII chart showing progress
      markdown += '```\n';
      markdown += 'Date       | Any Types | JS Imports | Completed %\n';
      markdown += '-----------|-----------|------------|------------\n';
      
      for (const { date, stats } of trendData) {
        const formattedDate = date.substring(0, 10);
        const completedPercentage = getPercentage(stats.completed, stats.totalFiles);
        const completedBar = generateProgressBar(completedPercentage);
        
        markdown += `${formattedDate} | ${stats.totalAnyCount.toString().padEnd(9)} | ${stats.totalJsImports.toString().padEnd(10)} | ${completedBar} ${completedPercentage}%\n`;
      }
      
      markdown += '```\n\n';
    }
    
    // Add latest stats
    if (trendData.length > 0) {
      const latest = trendData[trendData.length - 1].stats;
      
      markdown += '## Current Status\n\n';
      markdown += `- Files with 'any' types: ${latest.filesWithAny} (${getPercentage(latest.filesWithAny, latest.totalFiles)}%)\n`;
      markdown += `- Files with '.js' imports: ${latest.filesWithJsImports} (${getPercentage(latest.filesWithJsImports, latest.totalFiles)}%)\n`;
      markdown += `- Files completed: ${latest.completed} (${getPercentage(latest.completed, latest.totalFiles)}%)\n`;
      markdown += `- Total 'any' types: ${latest.totalAnyCount}\n`;
      markdown += `- Total '.js' imports: ${latest.totalJsImports}\n\n`;
    }
    
    // Write to file
    await fs.writeFile(trendPath, markdown, 'utf8');
    
    logVerbose(`Generated trend report at ${trendPath}`, verbose);
    
  } catch (error) {
    console.error(`Error generating trend report: ${error}`);
    throw error;
  }
}

/**
 * Helper function to get percentage
 */
function getPercentage(value: number, total: number): string {
  if (total === 0) return '0.0';
  return (value / total * 100).toFixed(1);
}

/**
 * Helper function to get priority text
 */
function getPriorityText(priority: PriorityLevel): string {
  switch (priority) {
    case PriorityLevel.HIGH:
      return 'High';
    case PriorityLevel.MEDIUM:
      return 'Medium';
    case PriorityLevel.LOW:
      return 'Low';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get status text
 */
function getStatusText(status: RefactorStatus): string {
  switch (status) {
    case RefactorStatus.COMPLETED:
      return 'Completed';
    case RefactorStatus.IN_PROGRESS:
      return 'In Progress';
    case RefactorStatus.PENDING:
      return 'Pending';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get critical files sorted by priority and impact
 */
function getSortedCriticalFiles(
  refactorMap: RefactorMap,
  limit: number
): Array<{ filePath: string; report: FileReport }> {
  const files = Object.entries(refactorMap)
    .map(([filePath, report]) => ({ filePath, report }))
    .filter(({ report }) => report.status !== RefactorStatus.COMPLETED)
    .sort((a, b) => {
      // Sort by priority first
      if (a.report.priority !== b.report.priority) {
        return a.report.priority - b.report.priority;
      }
      
      // Then by total issues (any + jsImports)
      const aIssues = a.report.anyCount + a.report.jsImportsCount;
      const bIssues = b.report.anyCount + b.report.jsImportsCount;
      return bIssues - aIssues;
    });
  
  return files.slice(0, limit);
}

/**
 * Generate a simple ASCII progress bar
 */
function generateProgressBar(percentage: string | number): string {
  const percent = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  const filledLength = Math.round(percent / 10);
  const emptyLength = 10 - filledLength;
  
  return `[${'='.repeat(filledLength)}${' '.repeat(emptyLength)}]`;
} 