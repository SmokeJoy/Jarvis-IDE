/**
 * YAML Reporter Module
 * Generates and parses YAML reports for type safety analysis
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { RefactorMap, RefactorStats } from '../types';
import { logVerbose } from '../utils';

/**
 * Generates a YAML report from the refactor map
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
    
    // Create report object
    const report = {
      version: getPackageVersion(),
      timestamp: new Date().toISOString(),
      stats: {
        totalFiles: stats.totalFiles,
        filesWithAny: stats.filesWithAny,
        filesWithJsImports: stats.filesWithJsImports,
        completed: stats.completed,
        inProgress: stats.inProgress,
        pending: stats.pending,
        highPriority: stats.highPriority,
        mediumPriority: stats.mediumPriority,
        lowPriority: stats.lowPriority,
        totalAnyCount: stats.totalAnyCount,
        totalJsImports: stats.totalJsImports
      },
      files: refactorMap
    };
    
    // Convert to YAML
    const yamlContent = yaml.dump(report, {
      indent: 2,
      lineWidth: -1,
      sortKeys: true
    });
    
    // Write to file
    await fs.writeFile(reportPath, yamlContent, 'utf8');
    
    logVerbose(`Generated YAML report at ${reportPath}`, verbose);
    
  } catch (error) {
    console.error(`Error generating YAML report: ${error}`);
    throw error;
  }
}

/**
 * Loads a refactor report from a YAML file
 */
export async function loadReport(
  reportPath: string,
  verbose = false
): Promise<{ refactorMap: RefactorMap; timestamp: string }> {
  try {
    if (!fs.existsSync(reportPath)) {
      logVerbose(`Report file not found at ${reportPath}`, verbose);
      return { refactorMap: {}, timestamp: new Date().toISOString() };
    }
    
    // Read and parse YAML file
    const fileContent = await fs.readFile(reportPath, 'utf8');
    const report = yaml.load(fileContent) as any;
    
    if (!report || !report.files) {
      logVerbose(`Invalid report format in ${reportPath}`, verbose);
      return { refactorMap: {}, timestamp: new Date().toISOString() };
    }
    
    logVerbose(`Loaded YAML report from ${reportPath}`, verbose);
    
    return {
      refactorMap: report.files as RefactorMap,
      timestamp: report.timestamp || new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error loading YAML report: ${error}`);
    return { refactorMap: {}, timestamp: new Date().toISOString() };
  }
}

/**
 * Merges a new refactor map with an existing one, preserving user-edited fields
 */
export function mergeRefactorMaps(
  existingMap: RefactorMap,
  newMap: RefactorMap
): RefactorMap {
  const mergedMap: RefactorMap = { ...newMap };
  
  // Preserve user-edited fields from existing entries
  for (const [filePath, existingReport] of Object.entries(existingMap)) {
    if (mergedMap[filePath]) {
      mergedMap[filePath] = {
        ...mergedMap[filePath],
        // Preserve these fields from the existing report
        status: existingReport.status,
        notes: existingReport.notes,
        assignedTo: existingReport.assignedTo
      };
    }
  }
  
  return mergedMap;
}

/**
 * Gets the package version from package.json
 */
function getPackageVersion(): string {
  try {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '0.0.0';
  } catch (error) {
    return '0.0.0';
  }
}

/**
 * Updates an existing YAML report with new data
 */
export async function updateReport(
  reportPath: string,
  newMap: RefactorMap,
  stats: RefactorStats,
  verbose = false
): Promise<void> {
  try {
    // Load existing report if it exists
    const { refactorMap: existingMap } = await loadReport(reportPath, verbose);
    
    // Merge with new data
    const mergedMap = mergeRefactorMaps(existingMap, newMap);
    
    // Generate and save updated report
    await generateReport(reportPath, mergedMap, stats, verbose);
    
    logVerbose(`Updated YAML report at ${reportPath}`, verbose);
    
  } catch (error) {
    console.error(`Error updating YAML report: ${error}`);
    
    // Create new report if update fails
    await generateReport(reportPath, newMap, stats, verbose);
  }
} 