#!/usr/bin/env node

/**
 * Type Safety HUD - Command Line Interface
 * A TypeScript type safety monitoring dashboard
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  analyzeProject, 
  generateHtmlDashboard, 
  displayDashboard, 
  loadReport, 
  updateTrend,
  outputJsonData
} from '../dist/index.js';

// Handle ES modules dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get package info
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const program = new Command();

program
  .name('type-safety-hud')
  .description('TypeScript type safety monitoring dashboard')
  .version(packageJson.version)
  .option('-p, --project <path>', 'path to project root directory', process.cwd())
  .option('-c, --config <path>', 'path to config file')
  .option('-o, --output <path>', 'output directory for reports')
  .option('--html', 'generate HTML dashboard')
  .option('--trend', 'update trend tracking file')
  .option('--json', 'output data as JSON')
  .option('--report-any', 'find all occurrences of "any" type')
  .option('--find-js-imports', 'find all .js imports')
  .option('--rename-js-to-ts', 'rename .js imports to .ts')
  .option('--generate-map', 'generate refactor map YAML file')
  .option('--quiet', 'suppress console output')
  .option('--debug', 'show debug information');

program.parse(process.argv);

const options = program.opts();

async function main() {
  try {
    // Load or create config
    const configPath = options.config 
      ? path.resolve(options.config)
      : path.resolve(options.project, 'type-safety-hud.config.js');
    
    let config = { rootDir: './src' };
    try {
      if (fs.existsSync(configPath)) {
        const configModule = await import(configPath);
        config = configModule.default || configModule;
      }
    } catch (error) {
      if (!options.quiet) {
        console.log(chalk.yellow('No config file found, using defaults'));
      }
    }
    
    // Setup output paths
    const outputDir = options.output || path.resolve(options.project, 'reports');
    fs.ensureDirSync(outputDir);
    
    const reportPath = path.resolve(outputDir, 'refactor-map.yaml');
    const htmlPath = path.resolve(outputDir, 'refactor-dashboard.html');
    const trendPath = path.resolve(outputDir, 'refactor-trend.md');
    
    // Analyze and load report
    let report;
    if (fs.existsSync(reportPath)) {
      report = await loadReport(reportPath);
    } else {
      if (!options.quiet) {
        console.log(chalk.blue('Analyzing project for type safety issues...'));
      }
      report = await analyzeProject(
        path.resolve(options.project, config.rootDir || './src')
      );
    }
    
    // Output based on options
    if (options.json) {
      outputJsonData(report);
      return;
    }
    
    if (options.trend) {
      await updateTrend(report, trendPath);
      if (!options.quiet) {
        console.log(chalk.green(`Trend data updated at ${trendPath}`));
      }
      return;
    }
    
    if (options.html) {
      await generateHtmlDashboard(report, htmlPath);
      if (!options.quiet) {
        console.log(chalk.green(`HTML dashboard generated at ${htmlPath}`));
      }
      return;
    }
    
    // Default: display CLI dashboard
    if (!options.quiet) {
      displayDashboard(report, trendPath);
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

main(); 