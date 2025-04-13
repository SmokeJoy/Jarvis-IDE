#!/usr/bin/env node

/**
 * Command-line interface for Type Safety HUD
 * Provides commands for analyzing TypeScript projects and generating reports
 */

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { TypeScriptAnalyzer } from './analyzers/typescript-analyzer';
import { MarkdownReporter } from './reporters/markdown-reporter';
import { HtmlReporter } from './reporters/html-reporter';
import { YamlReporter } from './reporters/yaml-reporter';
import { RefactorMap, RefactorStatus, TrendDataPoint } from './types';
import { loadRefactorMap, saveRefactorMap, calculateStats, getFormattedTimestamp } from './utils';
import chalk from 'chalk';

// Package info
const packageJson = require('../package.json');

// Default paths
const DEFAULT_CONFIG = {
  reportFile: 'type-safety-report.yaml',
  trendFile: 'type-safety-trend.yaml',
  mdReportFile: 'type-safety-report.md',
  htmlReportFile: 'type-safety-dashboard.html',
  baseDir: '.'
};

const program = new Command();

program
  .name('type-safety-hud')
  .description('TypeScript type safety analysis and reporting dashboard')
  .version(packageJson.version);

program
  .command('analyze')
  .description('Analyze TypeScript project for type safety issues')
  .option('-d, --dir <directory>', 'Root directory to analyze', DEFAULT_CONFIG.baseDir)
  .option('-o, --output <file>', 'Output report file', DEFAULT_CONFIG.reportFile)
  .option('-i, --include <pattern>', 'Files to include (glob pattern)', '**/*.ts')
  .option('-e, --exclude <pattern>', 'Files to exclude (glob pattern)', '**/node_modules/**,**/dist/**,**/.git/**')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-u, --update', 'Update existing refactor map instead of creating a new one', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Analyzing TypeScript project...'));
      
      // Ensure output directory exists
      await fs.ensureDir(path.dirname(options.output));
      
      // Load existing report if it exists
      let existingMap: RefactorMap = {};
      try {
        if (fs.existsSync(options.output)) {
          existingMap = await loadRefactorMap(options.output);
          console.log(chalk.gray(`Loaded existing report from ${options.output}`));
        }
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not load existing report: ${error.message}`));
      }
      
      // Create analyzer and analyze files
      const analyzer = new TypeScriptAnalyzer();
      const excludePatterns = options.exclude.split(',');
      const includePattern = options.include;
      
      console.log(chalk.gray(`Base directory: ${path.resolve(options.dir)}`));
      console.log(chalk.gray(`Include pattern: ${includePattern}`));
      console.log(chalk.gray(`Exclude patterns: ${excludePatterns.join(', ')}`));
      
      const refactorMap = await analyzer.walkAndAnalyze(
        options.dir,
        includePattern,
        excludePatterns,
        existingMap
      );
      
      // Save the report
      await saveRefactorMap(options.output, refactorMap);
      
      // Calculate statistics
      const stats = calculateStats(refactorMap);
      
      // Display summary
      console.log(chalk.green('\n✅ Analysis complete:'));
      console.log(`Total files analyzed: ${chalk.bold(stats.totalFiles)}`);
      console.log(`Files with 'any' types: ${chalk.bold(stats.filesWithAny)} (${(stats.filesWithAny / stats.totalFiles * 100).toFixed(1)}%)`);
      console.log(`Files with JS imports: ${chalk.bold(stats.filesWithJsImports)} (${(stats.filesWithJsImports / stats.totalFiles * 100).toFixed(1)}%)`);
      console.log(`High priority files: ${chalk.red(stats.highPriority)}`);
      console.log(`Medium priority files: ${chalk.yellow(stats.mediumPriority)}`);
      console.log(`Low priority files: ${chalk.green(stats.lowPriority)}`);
      console.log(`\nReport saved to: ${chalk.cyan(options.output)}`);
    } catch (error) {
      console.error(chalk.red(`Error analyzing project: ${error.message}`));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate reports from analysis data')
  .option('-i, --input <file>', 'Input report file', DEFAULT_CONFIG.reportFile)
  .option('-f, --format <format>', 'Report format (md, html, or all)', 'all')
  .option('-m, --md-output <file>', 'Markdown report output file', DEFAULT_CONFIG.mdReportFile)
  .option('-w, --html-output <file>', 'HTML dashboard output file', DEFAULT_CONFIG.htmlReportFile)
  .option('-t, --trend-file <file>', 'Trend data file', DEFAULT_CONFIG.trendFile)
  .option('-u, --update-trend', 'Update trend data', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue('📊 Generating reports...'));
      
      // Check if input file exists
      if (!fs.existsSync(options.input)) {
        console.error(chalk.red(`Error: Input file ${options.input} does not exist`));
        process.exit(1);
      }
      
      // Load refactor map
      const refactorMap = await loadRefactorMap(options.input);
      
      // Load trend data if it exists
      let trendData: TrendDataPoint[] = [];
      const trendFile = options.updateTrend ? options.trendFile : null;
      
      if (trendFile) {
        try {
          if (fs.existsSync(trendFile)) {
            trendData = await fs.readJson(trendFile);
          }
          
          // Add current data point
          const stats = calculateStats(refactorMap);
          const today = new Date().toISOString().split('T')[0];
          
          const newDataPoint: TrendDataPoint = {
            date: today,
            totalFiles: stats.totalFiles,
            filesWithAny: stats.filesWithAny,
            filesWithJsImports: stats.filesWithJsImports,
            completedFiles: stats.completed,
            inProgressFiles: stats.inProgress,
            pendingFiles: stats.pending
          };
          
          trendData.push(newDataPoint);
          
          // Save updated trend data
          await fs.writeJson(trendFile, trendData, { spaces: 2 });
          console.log(chalk.gray(`Updated trend data in ${trendFile}`));
        } catch (error) {
          console.error('Error updating trend data:', error);
        }
      }
      
      // Generate reports based on format
      if (options.format === 'all' || options.format === 'md') {
        const mdReporter = new MarkdownReporter(refactorMap);
        await mdReporter.generateReport(options.mdOutput);
        console.log(chalk.green(`✅ Markdown report generated: ${options.mdOutput}`));
      }
      
      if (options.format === 'all' || options.format === 'html') {
        const htmlReporter = new HtmlReporter(refactorMap, trendData);
        await htmlReporter.generateReport(options.htmlOutput);
        console.log(chalk.green(`✅ HTML dashboard generated: ${options.htmlOutput}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error generating reports: ${error.message}`));
      console.error(error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Display the current status of type safety refactoring')
  .option('-i, --input <file>', 'Input report file', DEFAULT_CONFIG.reportFile)
  .action(async (options) => {
    try {
      // Check if input file exists
      if (!fs.existsSync(options.input)) {
        console.error(chalk.red(`Error: Report file ${options.input} does not exist`));
        console.log(chalk.yellow('Run the analyze command first to generate a report.'));
        process.exit(1);
      }
      
      // Load refactor map
      const refactorMap = await loadRefactorMap(options.input);
      
      // Calculate statistics
      const stats = calculateStats(refactorMap);
      
      // Display summary
      console.log(chalk.blue('\n🔍 Type Safety Status:'));
      console.log(`Last updated: ${chalk.gray(new Date().toLocaleString())}`);
      console.log('\nGeneral Statistics:');
      console.log(`Total files analyzed: ${chalk.bold(stats.totalFiles)}`);
      console.log(`Files with 'any' types: ${chalk.bold(stats.filesWithAny)} (${(stats.filesWithAny / stats.totalFiles * 100).toFixed(1)}%)`);
      console.log(`Files with JS imports: ${chalk.bold(stats.filesWithJsImports)} (${(stats.filesWithJsImports / stats.totalFiles * 100).toFixed(1)}%)`);
      
      console.log('\nProgress:');
      console.log(`Completed: ${chalk.green(stats.completed)} (${(stats.completed / stats.totalFiles * 100).toFixed(1)}%)`);
      console.log(`In Progress: ${chalk.yellow(stats.inProgress)} (${(stats.inProgress / stats.totalFiles * 100).toFixed(1)}%)`);
      console.log(`Pending: ${chalk.gray(stats.pending)} (${(stats.pending / stats.totalFiles * 100).toFixed(1)}%)`);
      
      console.log('\nPriority:');
      console.log(`High Priority: ${chalk.red(stats.highPriority)}`);
      console.log(`Medium Priority: ${chalk.yellow(stats.mediumPriority)}`);
      console.log(`Low Priority: ${chalk.green(stats.lowPriority)}`);
      
      if (stats.criticalFiles.length > 0) {
        console.log('\nTop Critical Files:');
        stats.criticalFiles.slice(0, 5).forEach((item, index) => {
          const { filePath, report } = item;
          console.log(`${index + 1}. ${chalk.cyan(filePath)}`);
          console.log(`   'any' types: ${report.anyCount}, JS imports: ${report.jsImportsCount}`);
          console.log(`   Priority: ${getPriorityColor(report.priority)(getPriorityText(report.priority))}, Status: ${getStatusColor(report.status)(getStatusText(report.status))}`);
        });
      }
    } catch (error) {
      console.error(chalk.red(`Error displaying status: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('update-status')
  .description('Update the status of a file in the refactor map')
  .option('-i, --input <file>', 'Input report file', DEFAULT_CONFIG.reportFile)
  .option('-f, --file <filePath>', 'File path to update')
  .option('-s, --status <status>', 'New status (completed, in-progress, pending)')
  .action(async (options) => {
    try {
      // Check if input file exists
      if (!fs.existsSync(options.input)) {
        console.error(chalk.red(`Error: Report file ${options.input} does not exist`));
        process.exit(1);
      }
      
      // Check if file path is provided
      if (!options.file) {
        console.error(chalk.red('Error: File path is required'));
        process.exit(1);
      }
      
      // Check if status is valid
      const validStatuses = ['completed', 'in-progress', 'pending'];
      if (!options.status || !validStatuses.includes(options.status.toLowerCase())) {
        console.error(chalk.red(`Error: Status must be one of: ${validStatuses.join(', ')}`));
        process.exit(1);
      }
      
      // Load refactor map
      const refactorMap = await loadRefactorMap(options.input);
      
      // Find the file (case-insensitive match)
      const fileKey = Object.keys(refactorMap).find(
        key => key.toLowerCase() === options.file.toLowerCase()
      );
      
      if (!fileKey) {
        console.error(chalk.red(`Error: File ${options.file} not found in the report`));
        process.exit(1);
      }
      
      // Map status string to enum
      let newStatus: RefactorStatus;
      switch (options.status.toLowerCase()) {
        case 'completed':
          newStatus = RefactorStatus.COMPLETED;
          break;
        case 'in-progress':
          newStatus = RefactorStatus.IN_PROGRESS;
          break;
        case 'pending':
        default:
          newStatus = RefactorStatus.PENDING;
          break;
      }
      
      // Update status
      refactorMap[fileKey].status = newStatus;
      
      // Save refactor map
      await saveRefactorMap(options.input, refactorMap);
      
      console.log(chalk.green(`✅ Updated status of ${chalk.cyan(fileKey)} to ${getStatusColor(newStatus)(getStatusText(newStatus))}`));
    } catch (error) {
      console.error(chalk.red(`Error updating status: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('batch-update')
  .description('Batch update statuses based on a pattern')
  .option('-i, --input <file>', 'Input report file', DEFAULT_CONFIG.reportFile)
  .option('-p, --pattern <pattern>', 'File pattern to match (glob)')
  .option('-s, --status <status>', 'New status (completed, in-progress, pending)')
  .action(async (options) => {
    try {
      // Check if input file exists
      if (!fs.existsSync(options.input)) {
        console.error(chalk.red(`Error: Report file ${options.input} does not exist`));
        process.exit(1);
      }
      
      // Check if pattern is provided
      if (!options.pattern) {
        console.error(chalk.red('Error: File pattern is required'));
        process.exit(1);
      }
      
      // Check if status is valid
      const validStatuses = ['completed', 'in-progress', 'pending'];
      if (!options.status || !validStatuses.includes(options.status.toLowerCase())) {
        console.error(chalk.red(`Error: Status must be one of: ${validStatuses.join(', ')}`));
        process.exit(1);
      }
      
      // Load refactor map
      const refactorMap = await loadRefactorMap(options.input);
      
      // Map status string to enum
      let newStatus: RefactorStatus;
      switch (options.status.toLowerCase()) {
        case 'completed':
          newStatus = RefactorStatus.COMPLETED;
          break;
        case 'in-progress':
          newStatus = RefactorStatus.IN_PROGRESS;
          break;
        case 'pending':
        default:
          newStatus = RefactorStatus.PENDING;
          break;
      }
      
      // Update status for matching files
      const { minimatch } = await import('minimatch');
      const matchedFiles = Object.keys(refactorMap).filter(filePath => 
        minimatch(filePath, options.pattern)
      );
      
      if (matchedFiles.length === 0) {
        console.log(chalk.yellow(`No files matched the pattern: ${options.pattern}`));
        process.exit(0);
      }
      
      matchedFiles.forEach(filePath => {
        refactorMap[filePath].status = newStatus;
      });
      
      // Save refactor map
      await saveRefactorMap(options.input, refactorMap);
      
      console.log(chalk.green(`✅ Updated status of ${chalk.cyan(matchedFiles.length)} files to ${getStatusColor(newStatus)(getStatusText(newStatus))}`));
      console.log(chalk.gray('First few files:'));
      matchedFiles.slice(0, 5).forEach(filePath => {
        console.log(chalk.gray(`- ${filePath}`));
      });
      if (matchedFiles.length > 5) {
        console.log(chalk.gray(`... and ${matchedFiles.length - 5} more`));
      }
    } catch (error) {
      console.error(chalk.red(`Error in batch update: ${error.message}`));
      process.exit(1);
    }
  });

// Helper functions for colorizing output
function getPriorityColor(priority: number): Function {
  switch (priority) {
    case 0: return chalk.red;
    case 1: return chalk.yellow;
    case 2: return chalk.green;
    default: return chalk.gray;
  }
}

function getStatusColor(status: RefactorStatus): Function {
  switch (status) {
    case RefactorStatus.COMPLETED: return chalk.green;
    case RefactorStatus.IN_PROGRESS: return chalk.yellow;
    case RefactorStatus.PENDING: return chalk.gray;
    default: return chalk.gray;
  }
}

function getPriorityText(priority: number): string {
  switch (priority) {
    case 0: return 'High';
    case 1: return 'Medium';
    case 2: return 'Low';
    default: return 'Unknown';
  }
}

function getStatusText(status: RefactorStatus): string {
  switch (status) {
    case RefactorStatus.COMPLETED: return 'Completed';
    case RefactorStatus.IN_PROGRESS: return 'In Progress';
    case RefactorStatus.PENDING: return 'Pending';
    default: return 'Unknown';
  }
}

// If this file is run directly, parse command line args
if (require.main === module) {
  program.parse(process.argv);
} 