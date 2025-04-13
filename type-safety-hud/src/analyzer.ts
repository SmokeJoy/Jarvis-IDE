/**
 * Analyzer module for TypeScript files
 * Scans codebase for 'any' types and .js imports
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as ts from 'typescript';
import { glob } from 'glob';
import { execSync } from 'child_process';
import { 
  FileReport, 
  RefactorMap, 
  RefactorStatus, 
  PriorityLevel,
  AnalyzerOptions,
  CodeLocation
} from './types';
import { 
  makeRelativePath, 
  shouldExcludeFile, 
  getFileStats, 
  calculatePriority,
  logVerbose
} from './utils';

/**
 * Analyzes TypeScript files for type safety issues
 */
export class TypeScriptAnalyzer {
  private config: Required<AnalyzerOptions>;

  /**
   * Creates a new instance of the TypeScript analyzer
   * @param config Configuration for the analyzer
   */
  constructor(config?: AnalyzerOptions) {
    this.config = {
      excludePatterns: config?.excludePatterns ?? [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      includePatterns: config?.includePatterns ?? ['**/*.ts', '**/*.tsx'],
      verbose: config?.verbose ?? false,
    };
  }

  /**
   * Finds all TypeScript files in the given directory
   * @param rootDir Root directory to search in
   * @returns List of file paths
   */
  public findTsFiles(rootDir: string): string[] {
    const allFiles: string[] = this.walkDir(rootDir);
    
    // Filter files by include and exclude patterns
    const includeMatcher = this.createPatternMatcher(this.config.includePatterns);
    const excludeMatcher = this.createPatternMatcher(this.config.excludePatterns);
    
    return allFiles.filter(file => {
      const relativePath = path.relative(rootDir, file);
      return includeMatcher(relativePath) && !excludeMatcher(relativePath);
    });
  }

  /**
   * Analyzes a TypeScript file for 'any' types and JS imports
   * @param filePath Path to the file to analyze
   * @returns Analysis report for the file
   */
  public analyzeFile(filePath: string): FileReport {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Find 'any' types with locations
    const anyLocations = this.findAnyTypesWithLocations(filePath, fileContent);
    
    // Find JS imports with locations
    const jsImportLocations = this.findJsImportsWithLocations(fileContent);
    
    // Calculate priority
    const priority = this.calculatePriority(anyLocations.length, jsImportLocations.length);
    
    return {
      anyCount: anyLocations.length,
      jsImportsCount: jsImportLocations.length,
      anyLocations,
      jsImportLocations,
      priority,
      status: RefactorStatus.PENDING,
      lastAnalyzed: new Date().toISOString(),
    };
  }

  /**
   * Creates a pattern matcher function for glob patterns
   * @param patterns List of glob patterns
   * @returns Function that checks if a path matches any of the patterns
   */
  private createPatternMatcher(patterns: string[]): (path: string) => boolean {
    const regexPatterns = patterns.map(pattern => {
      return new RegExp(
        '^' + 
        pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\?/g, '[^/]') + 
        '$'
      );
    });
    
    return (path: string) => regexPatterns.some(regex => regex.test(path));
  }

  /**
   * Walks a directory recursively and returns all files
   * @param dir Directory to walk
   * @returns List of file paths
   */
  private walkDir(dir: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }
    
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(this.walkDir(filePath));
      } else {
        results.push(filePath);
      }
    }
    
    return results;
  }

  /**
   * Finds all 'any' types in a TypeScript file with their locations
   * @param filePath Path to the file
   * @param fileContent Content of the file
   * @returns List of 'any' type locations
   */
  private findAnyTypesWithLocations(filePath: string, fileContent: string): CodeLocation[] {
    try {
      const locations: CodeLocation[] = [];
      const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true
      );
      
      const visit = (node: ts.Node) => {
        if ((ts.isTypeReferenceNode(node) && node.typeName.getText() === 'any') || 
            ts.isAnyKeyword(node)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          
          // Get context (line of code)
          const lineStart = fileContent.lastIndexOf('\n', node.getStart()) + 1;
          const lineEnd = fileContent.indexOf('\n', node.getStart());
          const contextLine = fileContent.substring(
            lineStart, 
            lineEnd > -1 ? lineEnd : fileContent.length
          ).trim();
          
          locations.push({
            line: line + 1,
            column: character + 1,
            context: contextLine
          });
        }
        
        ts.forEachChild(node, visit);
      };
      
      visit(sourceFile);
      
      // Also find 'as any' assertions
      const lines = fileContent.split('\n');
      const asAnyRegex = /as\s+any/g;
      
      lines.forEach((line, lineIndex) => {
        let match;
        while ((match = asAnyRegex.exec(line)) !== null) {
          locations.push({
            line: lineIndex + 1,
            column: match.index + 1,
            context: line.trim()
          });
        }
      });
      
      return locations;
    } catch (error) {
      console.error(`Errore nell'analisi del file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Finds all JS imports in a file with their locations
   * @param fileContent Content of the file
   * @returns List of JS import locations
   */
  private findJsImportsWithLocations(fileContent: string): CodeLocation[] {
    const locations: CodeLocation[] = [];
    const lines = fileContent.split('\n');
    
    // Find JS imports
    const jsImportRegex = /from\s+['"](.+\.js)['"]/g;
    const jsRequireRegex = /require\(\s*['"](.+\.js)['"]\s*\)/g;
    
    lines.forEach((line, lineIndex) => {
      // Check for 'from' imports
      let match;
      while ((match = jsImportRegex.exec(line)) !== null) {
        locations.push({
          line: lineIndex + 1,
          column: match.index + 1,
          context: line.trim(),
          importPath: match[1]
        });
      }
      
      // Check for require() calls
      while ((match = jsRequireRegex.exec(line)) !== null) {
        locations.push({
          line: lineIndex + 1,
          column: match.index + 1,
          context: line.trim(),
          importPath: match[1]
        });
      }
    });
    
    return locations;
  }

  /**
   * Calculates the priority of a file based on the number of issues
   * @param anyCount Number of 'any' types
   * @param jsImportsCount Number of JS imports
   * @returns Priority level
   */
  private calculatePriority(anyCount: number, jsImportsCount: number): PriorityLevel {
    const total = anyCount + jsImportsCount;
    
    if (total >= 10) {
      return PriorityLevel.HIGH;
    } else if (total >= 3) {
      return PriorityLevel.MEDIUM;
    } else {
      return PriorityLevel.LOW;
    }
  }
}

/**
 * Analyzes a single TypeScript file for 'any' types and .js imports
 */
export function analyzeFile(
  filePath: string, 
  rootDir: string, 
  options: AnalyzerOptions
): FileReport {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const relativePath = makeRelativePath(filePath, rootDir);
    
    // Get file stats
    const { size, lastModified } = getFileStats(filePath);
    
    // Find 'any' types with locations
    const anyLocations: CodeLocation[] = [];
    const lines = fileContent.split('\n');
    const anyRegex = /: any(?![a-zA-Z0-9_])/g;
    const asAnyRegex = /as\s+any/g;
    
    let anyCount = 0;
    
    lines.forEach((line, lineIndex) => {
      // Check for ': any' type annotations
      let match;
      while ((match = anyRegex.exec(line)) !== null) {
        anyCount++;
        anyLocations.push({
          line: lineIndex + 1,
          column: match.index + 1,
          context: line.trim()
        });
      }
      
      // Check for 'as any' type assertions
      while ((match = asAnyRegex.exec(line)) !== null) {
        anyCount++;
        anyLocations.push({
          line: lineIndex + 1,
          column: match.index + 1,
          context: line.trim()
        });
      }
    });
    
    // Find JS imports with locations
    const jsImportLocations: CodeLocation[] = [];
    const jsImportRegex = /from\s+['"](.+\.js)['"]/g;
    const jsRequireRegex = /require\(\s*['"](.+\.js)['"]\s*\)/g;
    
    let jsImportsCount = 0;
    
    lines.forEach((line, lineIndex) => {
      // Check for 'from' imports
      let match;
      while ((match = jsImportRegex.exec(line)) !== null) {
        jsImportsCount++;
        jsImportLocations.push({
          line: lineIndex + 1,
          column: match.index + 1,
          context: line.trim(),
          importPath: match[1]
        });
      }
      
      // Check for require() calls
      while ((match = jsRequireRegex.exec(line)) !== null) {
        jsImportsCount++;
        jsImportLocations.push({
          line: lineIndex + 1,
          column: match.index + 1,
          context: line.trim(),
          importPath: match[1]
        });
      }
    });
    
    // Calculate priority
    const priority = calculatePriority(
      anyCount, 
      jsImportsCount, 
      options.highPriorityThreshold || 10,
      options.mediumPriorityThreshold || 5
    );
    
    return {
      anyCount,
      jsImportsCount,
      anyLocations,
      jsImportLocations,
      priority,
      status: options.autoCompleteEmptyFiles && anyCount === 0 && jsImportsCount === 0
        ? RefactorStatus.COMPLETED
        : RefactorStatus.PENDING,
      lastAnalyzed: new Date().toISOString(),
      fileSize: size,
      lastModified
    };
  } catch (error) {
    logVerbose(
      options.verbose,
      `Errore nell'analisi del file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
    
    return {
      anyCount: 0,
      jsImportsCount: 0,
      anyLocations: [],
      jsImportLocations: [],
      priority: PriorityLevel.LOW,
      status: RefactorStatus.ERROR,
      lastAnalyzed: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Uses grep to find all occurrences of 'any' types in the codebase
 * This is faster than parsing each file with the TypeScript compiler
 */
export function findAnyTypesWithGrep(rootDir: string, options: AnalyzerOptions): Map<string, number> {
  try {
    const results = new Map<string, number>();
    const grepCommand = `grep -r ": any" --include="*.ts" --include="*.tsx" ${rootDir}`;
    
    try {
      const grepOutput = execSync(grepCommand, { encoding: 'utf8' });
      const lines = grepOutput.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const filePath = line.substring(0, colonIndex);
          
          if (shouldExcludeFile(filePath, options.exclude || [])) {
            continue;
          }
          
          if (!options.includeTests && filePath.includes('__tests__')) {
            continue;
          }
          
          results.set(filePath, (results.get(filePath) || 0) + 1);
        }
      }
    } catch (error) {
      // grep returns non-zero exit code if no matches found
      logVerbose(`Grep search for 'any' types completed with no results or error`, options.verbose);
    }
    
    return results;
  } catch (error) {
    logVerbose(`Error finding any types: ${error}`, options.verbose);
    return new Map<string, number>();
  }
}

/**
 * Uses grep to find all occurrences of .js imports in the codebase
 */
export function findJsImportsWithGrep(rootDir: string, options: AnalyzerOptions): Map<string, number> {
  try {
    const results = new Map<string, number>();
    const grepCommand = `grep -r "from ['\\\"].*\\.js['\\\"]" --include="*.ts" --include="*.tsx" ${rootDir}`;
    
    try {
      const grepOutput = execSync(grepCommand, { encoding: 'utf8' });
      const lines = grepOutput.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          const filePath = line.substring(0, colonIndex);
          
          if (shouldExcludeFile(filePath, options.exclude || [])) {
            continue;
          }
          
          if (!options.includeTests && filePath.includes('__tests__')) {
            continue;
          }
          
          results.set(filePath, (results.get(filePath) || 0) + 1);
        }
      }
    } catch (error) {
      // grep returns non-zero exit code if no matches found
      logVerbose(`Grep search for '.js imports' completed with no results or error`, options.verbose);
    }
    
    return results;
  } catch (error) {
    logVerbose(`Error finding js imports: ${error}`, options.verbose);
    return new Map<string, number>();
  }
}

/**
 * Scans the TypeScript files in a directory
 */
export async function scanTypeScriptFiles(
  rootDir: string, 
  options: AnalyzerOptions = {}
): Promise<RefactorMap> {
  const refactorMap: RefactorMap = {};
  
  // Set default options
  const opts: Required<AnalyzerOptions> = {
    rootDir,
    exclude: options.exclude || ['node_modules', 'dist', 'build', 'coverage'],
    includeTests: options.includeTests || false,
    verbose: options.verbose || false,
    highPriorityThreshold: options.highPriorityThreshold || 10,
    mediumPriorityThreshold: options.mediumPriorityThreshold || 5,
    useGrep: options.useGrep ?? true,
  };
  
  logVerbose(`Scanning TypeScript files in ${rootDir}...`, opts.verbose);
  
  if (opts.useGrep) {
    // Use grep for faster scanning
    const anyTypesMap = findAnyTypesWithGrep(rootDir, opts);
    const jsImportsMap = findJsImportsWithGrep(rootDir, opts);
    
    // Combine results
    const allFilePaths = new Set([...anyTypesMap.keys(), ...jsImportsMap.keys()]);
    
    for (const filePath of allFilePaths) {
      const anyCount = anyTypesMap.get(filePath) || 0;
      const jsImportsCount = jsImportsMap.get(filePath) || 0;
      const { size, lastModified } = getFileStats(filePath);
      const relativePath = makeRelativePath(filePath, rootDir);
      
      const priority = calculatePriority(
        anyCount, 
        jsImportsCount, 
        opts.highPriorityThreshold,
        opts.mediumPriorityThreshold
      );
      
      refactorMap[filePath] = {
        filePath,
        relativePath,
        anyCount,
        jsImportsCount,
        status: RefactorStatus.Pending,
        priority,
        fileSize: size,
        lastModified
      };
    }
  } else {
    // Use glob to find files
    const tsFiles = await glob(`${rootDir}/**/*.{ts,tsx}`, { ignore: opts.exclude.map(e => `${rootDir}/**/${e}/**`) });
    
    for (const filePath of tsFiles) {
      if (shouldExcludeFile(filePath, opts.exclude)) {
        continue;
      }
      
      if (!opts.includeTests && filePath.includes('__tests__')) {
        continue;
      }
      
      const fileReport = analyzeFile(filePath, rootDir, opts);
      refactorMap[filePath] = fileReport;
    }
  }
  
  logVerbose(`Found ${Object.keys(refactorMap).length} TypeScript files to analyze`, opts.verbose);
  return refactorMap;
}

/**
 * Updates an existing refactor map with the latest analysis
 */
export async function updateRefactorMap(
  existingMap: RefactorMap, 
  rootDir: string, 
  options: AnalyzerOptions = {}
): Promise<RefactorMap> {
  const newMap = await scanTypeScriptFiles(rootDir, options);
  const updatedMap: RefactorMap = { ...existingMap };
  
  // Update existing entries and add new ones
  for (const [filePath, report] of Object.entries(newMap)) {
    if (existingMap[filePath]) {
      // Preserve status and notes from existing entry
      updatedMap[filePath] = {
        ...report,
        status: existingMap[filePath].status,
        notes: existingMap[filePath].notes,
        assignedTo: existingMap[filePath].assignedTo
      };
    } else {
      updatedMap[filePath] = report;
    }
  }
  
  // Remove entries for files that no longer exist
  for (const filePath of Object.keys(existingMap)) {
    if (!fs.existsSync(filePath) && updatedMap[filePath]) {
      delete updatedMap[filePath];
    }
  }
  
  return updatedMap;
} 