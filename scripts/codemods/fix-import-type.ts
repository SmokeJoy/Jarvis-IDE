/**
 * @file fix-import-type.ts
 * @description Script per correggere automaticamente gli import type usati come valori
 */

import fs from 'fs';
import path from 'path';
// import { getLogger } from '../shared/logging.js';

// Fallback temporaneo per il logger
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug
};

// Tipi forti per le opzioni e i risultati
interface Options {
  dryRun?: boolean;
  verbose?: boolean;
  excludeDirs?: string[];
  includePatterns?: string[];
}

interface ImportFix {
  original: string;
  fixed: string;
  line: number;
  file: string;
  imports: string[];
}

interface FixResult {
  success: boolean;
  fixes: ImportFix[];
  error?: string;
}

// Costanti per la configurazione
const DEFAULT_OPTIONS: Options = {
  dryRun: false,
  verbose: false,
  excludeDirs: ['node_modules', '.git', 'dist', 'build'],
  includePatterns: ['.ts', '.tsx']
};

/**
 * Analizza un file per trovare gli import type usati come valori
 */
function analyzeFile(filePath: string): FixResult {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fixes: ImportFix[] = [];

    // Regex migliorata per gestire più casi di import type
    const importTypeRegex = /import\s+type\s*[{]([^}]+)[}]\s*from\s*['"]([^'"]+)['"]/g;
    
    let fileContent = content;
    let match;
    
    while ((match = importTypeRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(i => {
        const parts = i.trim().split(' as ');
        return parts[0].trim();
      });
      
      const importPath = match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      // Verifica se gli import sono usati come valori
      const usedImports = imports.filter(imp => {
        // Cerca vari pattern di utilizzo come valore
        const patterns = [
          `\\b${imp}\\s*\\(`,           // chiamata di funzione
          `new\\s+${imp}\\b`,           // new operator
          `instanceof\\s+${imp}\\b`,     // instanceof check
          `extends\\s+${imp}\\b`,       // extends
          `implements\\s+${imp}\\b`,     // implements
          `=\\s*${imp}\\b`,             // assegnamento
          `:\\s*${imp}\\b`,             // type annotation
        ];
        
        const usageRegex = new RegExp(patterns.join('|'), 'g');
        const matches = fileContent.match(usageRegex);
        
        if (matches) {
          logger.debug(`Found usage of ${imp} in ${filePath}:${lineNumber}`);
          logger.debug(`Matches: ${matches.join(', ')}`);
        }
        
        return matches !== null;
      });

      if (usedImports.length > 0) {
        const original = match[0];
        const fixed = `import { ${usedImports.join(', ')} } from '${importPath}'`;
        
        fixes.push({
          original,
          fixed,
          line: lineNumber,
          file: filePath,
          imports: usedImports
        });

        logger.info(`Found type imports used as values: ${usedImports.join(', ')} in ${filePath}:${lineNumber}`);
      }
    }

    return { success: true, fixes };
  } catch (error) {
    logger.error('Error analyzing file:', error);
    return {
      success: false,
      fixes: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Applica le correzioni a un file
 */
function applyFixes(filePath: string, fixes: ImportFix[], options: Options = DEFAULT_OPTIONS): FixResult {
  try {
    if (fixes.length === 0) return { success: true, fixes: [] };

    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Applica le correzioni in ordine inverso per non invalidare gli indici
    fixes.reverse().forEach(fix => {
      if (options.dryRun) {
        logger.info(`Would replace in ${filePath}:`);
        logger.info(`  - ${fix.original}`);
        logger.info(`  + ${fix.fixed}`);
      } else {
        content = content.replace(fix.original, fix.fixed);
        if (options.verbose) {
          logger.info(`Applied fix in ${filePath}:`);
          logger.info(`  - ${fix.original}`);
          logger.info(`  + ${fix.fixed}`);
        }
      }
    });

    if (!options.dryRun) {
      fs.writeFileSync(filePath, content);
      logger.info(`Applied ${fixes.length} fixes to ${filePath}`);
    }

    return { success: true, fixes };
  } catch (error) {
    logger.error('Error applying fixes:', error);
    return {
      success: false,
      fixes: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Scansiona ricorsivamente una directory
 */
function scanDirectory(dir: string, options: Options = DEFAULT_OPTIONS): FixResult {
  try {
    const allFixes: ImportFix[] = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Salta directory escluse
        if (options.excludeDirs?.includes(entry.name)) {
          if (options.verbose) {
            logger.info(`Skipping directory: ${entry.name}`);
          }
          continue;
        }
        const result = scanDirectory(fullPath, options);
        if (result.success) {
          allFixes.push(...result.fixes);
        } else {
          logger.error(`Error scanning directory ${fullPath}:`, result.error);
        }
      } else if (options.includePatterns?.some(pattern => entry.name.endsWith(pattern))) {
        if (options.verbose) {
          logger.info(`Analyzing file: ${fullPath}`);
        }
        const result = analyzeFile(fullPath);
        if (result.success) {
          allFixes.push(...result.fixes);
        } else {
          logger.error(`Error analyzing file ${fullPath}:`, result.error);
        }
      }
    }

    return { success: true, fixes: allFixes };
  } catch (error) {
    logger.error('Error scanning directory:', error);
    return {
      success: false,
      fixes: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Funzione principale
 */
async function main() {
  try {
    const options: Options = {
      ...DEFAULT_OPTIONS,
      dryRun: process.argv.includes('--dry-run'),
      verbose: process.argv.includes('--verbose')
    };

    logger.info('Starting import type fixes...');
    if (options.dryRun) {
      logger.info('Running in dry-run mode - no changes will be made');
    }

    const srcDir = path.join(process.cwd(), 'src');
    const result = scanDirectory(srcDir, options);

    if (!result.success) {
      throw new Error(result.error);
    }

    logger.info(`Found ${result.fixes.length} import type issues to fix`);

    // Raggruppa le correzioni per file
    const fixesByFile = result.fixes.reduce((acc, fix) => {
      if (!acc[fix.file]) acc[fix.file] = [];
      acc[fix.file].push(fix);
      return acc;
    }, {} as Record<string, ImportFix[]>);

    // Applica le correzioni file per file
    for (const [file, fileFixes] of Object.entries(fixesByFile)) {
      const applyResult = applyFixes(file, fileFixes, options);
      if (!applyResult.success) {
        logger.error(`Failed to apply fixes to ${file}:`, applyResult.error);
      }
    }

    // Genera report anche se non ci sono fix
    const report = result.fixes.map(fix => ({
      file: path.relative(process.cwd(), fix.file),
      line: fix.line,
      original: fix.original,
      fixed: fix.fixed,
      imports: fix.imports
    }));

    // Crea la directory se non esiste
    const reportDir = path.join(process.cwd(), 'docs/build');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'import-type-fixes.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    logger.info(`Report saved to ${reportPath} with ${report.length} fixes`);
    
    if (report.length === 0) {
      logger.info('No import type issues found to fix');
    } else if (options.dryRun) {
      logger.info('No changes were made (dry-run mode)');
    } else {
      logger.info(`Applied ${report.length} fixes`);
    }

  } catch (error) {
    logger.error('Error fixing import types:', error);
    process.exit(1);
  }
}

// Esporta per i test
export { analyzeFile, applyFixes, scanDirectory, type Options, type ImportFix, type FixResult };

// Esegui lo script solo se non è importato come modulo
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  main();
} 