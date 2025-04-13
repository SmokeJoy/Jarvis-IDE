import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { FileReport, PriorityLevel, RefactorStatus, AnalysisOptions } from '../types';

/**
 * TypeScript analyzer for counting 'any' types and '.js' imports
 */
export class TypeScriptAnalyzer {
  private options: AnalysisOptions;

  constructor(options: AnalysisOptions = {}) {
    this.options = options;
  }

  /**
   * Analyzes a TypeScript file to count 'any' types and '.js' imports
   * @param filePath Path to the TypeScript file
   * @returns A FileReport object with analysis results
   */
  public analyzeFile(filePath: string): FileReport {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const anyCount = this.countAnyTypes(filePath);
    const jsImportsCount = this.countJsImports(filePath);
    
    // Calculate priority based on counts
    const priority = this.calculatePriority(anyCount, jsImportsCount);
    
    return {
      anyCount,
      jsImportsCount,
      priority,
      status: RefactorStatus.PENDING
    };
  }

  /**
   * Recursively walks a directory and analyzes all TypeScript files
   * @param dir Directory to walk
   * @param result Map to store results
   */
  public walkAndAnalyze(dir: string, result: Record<string, FileReport> = {}): Record<string, FileReport> {
    if (!fs.existsSync(dir)) {
      throw new Error(`Directory not found: ${dir}`);
    }

    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other excluded directories
        if (this.shouldSkipDirectory(filePath)) {
          continue;
        }
        
        // Recursively process subdirectories
        this.walkAndAnalyze(filePath, result);
      } else if (this.isTypeScriptFile(filePath)) {
        // Analyze TypeScript files
        if (this.shouldIncludeFile(filePath)) {
          result[filePath] = this.analyzeFile(filePath);
          
          if (this.options.verbose) {
            console.log(`Analyzed: ${filePath}`);
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Counts 'any' type occurrences in a TypeScript file
   * @param filePath Path to the TypeScript file
   * @returns Number of 'any' type occurrences
   */
  private countAnyTypes(filePath: string): number {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );
    
    let anyCount = 0;
    
    function visit(node: ts.Node) {
      if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'any') {
        anyCount++;
      } else if (ts.isAnyKeyword(node)) {
        anyCount++;
      }
      
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    return anyCount;
  }

  /**
   * Counts '.js' imports in a TypeScript file
   * @param filePath Path to the TypeScript file
   * @returns Number of '.js' imports
   */
  private countJsImports(filePath: string): number {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );
    
    let jsImportCount = 0;
    
    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        
        if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
          const importPath = moduleSpecifier.text;
          
          // Count relative imports ending with .js
          if (importPath.startsWith('.') && importPath.endsWith('.js')) {
            jsImportCount++;
          }
        }
      }
      
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    return jsImportCount;
  }

  /**
   * Calculates priority level based on 'any' count and '.js' import count
   * @param anyCount Number of 'any' types
   * @param jsImportsCount Number of '.js' imports
   * @returns Priority level
   */
  private calculatePriority(anyCount: number, jsImportsCount: number): PriorityLevel {
    if (anyCount > 5 || jsImportsCount > 3) {
      return PriorityLevel.HIGH;
    } else if (anyCount > 0 || jsImportsCount > 0) {
      return PriorityLevel.MEDIUM;
    } else {
      return PriorityLevel.LOW;
    }
  }

  /**
   * Checks if a file is a TypeScript file
   * @param filePath Path to check
   * @returns True if the file is a TypeScript file
   */
  private isTypeScriptFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.ts' || ext === '.tsx';
  }

  /**
   * Checks if a directory should be skipped
   * @param dirPath Path to check
   * @returns True if the directory should be skipped
   */
  private shouldSkipDirectory(dirPath: string): boolean {
    const basename = path.basename(dirPath);
    const excludeDirs = ['node_modules', 'dist', 'build', '.git', 'coverage'];
    
    // Check against exclude patterns
    if (this.options.excludePatterns) {
      for (const pattern of this.options.excludePatterns) {
        if (new RegExp(pattern).test(dirPath)) {
          return true;
        }
      }
    }
    
    return excludeDirs.includes(basename);
  }

  /**
   * Checks if a file should be included in analysis
   * @param filePath Path to check
   * @returns True if the file should be included
   */
  private shouldIncludeFile(filePath: string): boolean {
    // Check against include patterns
    if (this.options.includePatterns && this.options.includePatterns.length > 0) {
      for (const pattern of this.options.includePatterns) {
        if (new RegExp(pattern).test(filePath)) {
          return true;
        }
      }
      return false;
    }
    
    // Check against exclude patterns
    if (this.options.excludePatterns) {
      for (const pattern of this.options.excludePatterns) {
        if (new RegExp(pattern).test(filePath)) {
          return false;
        }
      }
    }
    
    return true;
  }
} 