import { z } from 'zod';
import * as vscode from 'vscode';
import { HandlerFunction } from '../types';
import { readFile } from 'fs/promises';
import { extname } from 'path';
import { LintConfigArgs } from '../mcp.types';

interface ConfigLinterArgs {
  filePath: string;
  configType?: 'json' | 'yaml' | 'env' | 'auto';
  strict?: boolean;
}

interface LinterResult {
  isValid: boolean;
  errors: LinterError[];
  warnings: LinterWarning[];
  suggestions: string[];
}

interface LinterError {
  message: string;
  line?: number;
  column?: number;
  code: string;
}

interface LinterWarning {
  message: string;
  line?: number;
  column?: number;
  code: string;
}

function detectConfigType(filePath: string): 'json' | 'yaml' | 'env' {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.json':
      return 'json';
    case '.yml':
    case '.yaml':
      return 'yaml';
    case '.env':
      return 'env';
    default:
      return 'json';
  }
}

async function validateJson(content: string): Promise<LinterResult> {
  const result: LinterResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  try {
    const parsed = JSON.parse(content);

    // Verifica la presenza di campi obbligatori comuni
    if (!parsed.version) {
      result.warnings.push({
        message: 'Campo "version" mancante',
        code: 'MISSING_VERSION',
      });
    }

    // Verifica valori nulli o vuoti
    const checkNullOrEmpty = (obj: any, path: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        if (value === null) {
          result.warnings.push({
            message: `Il campo "${currentPath}" è null`,
            code: 'NULL_VALUE',
          });
        } else if (value === '') {
          result.warnings.push({
            message: `Il campo "${currentPath}" è vuoto`,
            code: 'EMPTY_VALUE',
          });
        } else if (typeof value === 'object') {
          checkNullOrEmpty(value, currentPath);
        }
      }
    };

    checkNullOrEmpty(parsed);
  } catch (error) {
    result.isValid = false;
    result.errors.push({
      message: `Errore di parsing JSON: ${error.message}`,
      code: 'INVALID_JSON',
    });
  }

  return result;
}

async function validateEnv(content: string): Promise<LinterResult> {
  const result: LinterResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Ignora commenti e linee vuote
    if (line.trim().startsWith('#') || !line.trim()) {
      return;
    }

    // Verifica formato KEY=VALUE
    if (!line.includes('=')) {
      result.errors.push({
        message: 'Formato non valido, manca il simbolo "="',
        line: index + 1,
        code: 'INVALID_FORMAT',
      });
      return;
    }

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');

    // Verifica chiave valida
    if (!key.trim()) {
      result.errors.push({
        message: 'Chiave mancante',
        line: index + 1,
        code: 'MISSING_KEY',
      });
    }

    // Verifica valore non vuoto
    if (!value.trim()) {
      result.warnings.push({
        message: 'Valore vuoto',
        line: index + 1,
        code: 'EMPTY_VALUE',
      });
    }

    // Suggerimenti per valori sensibili
    if (
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('password')
    ) {
      result.suggestions.push(
        `Considera di utilizzare variabili d'ambiente sicure per "${key.trim()}"`
      );
    }
  });

  return result;
}

async function lintConfig(args: LintConfigArgs): Promise<LinterResult> {
  const { configPath, configType } = args;
  try {
    const content = await readFile(configPath, 'utf-8');

    switch (configType) {
      case 'json':
        return await validateJson(content);
      case 'env':
        return await validateEnv(content);
      case 'yaml':
        // TODO: Implementare validazione YAML
        return {
          isValid: true,
          errors: [],
          warnings: [
            {
              message: 'Validazione YAML non ancora implementata',
              code: 'YAML_NOT_IMPLEMENTED',
            },
          ],
          suggestions: [],
        };
      default:
        throw new Error(`Tipo di configurazione non supportato: ${configType}`);
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          message: `Errore durante la lettura del file: ${error.message}`,
          code: 'FILE_READ_ERROR',
        },
      ],
      warnings: [],
      suggestions: [],
    };
  }
}

export const configLinter: HandlerFunction = async (args: LintConfigArgs) => {
  // Supporto retrocompatibilità: se viene usato filePath invece di configPath
  const configPath = args.configPath || (args as any).filePath;
  const { configType = 'auto', strict = false } = args;

  try {
    const detectedType = configType === 'auto' ? detectConfigType(configPath) : configType;
    const result = await lintConfig(configPath, detectedType);

    // In modalità strict, i warning vengono trattati come errori
    if (strict && result.warnings.length > 0) {
      result.isValid = false;
      result.errors.push(
        ...result.warnings.map((warning) => ({
          ...warning,
          message: `[STRICT] ${warning.message}`,
        }))
      );
      result.warnings = [];
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to lint config file: ${error.message}`,
    };
  }
};
