import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// Import validators and types
import type { 
  isValidChatMessage, 
  isValidChatMessageArray,
  isValidChatSettings, 
  isValidApiConfiguration,
  validateChatMessageOrThrow,
  validateChatMessageArrayOrThrow,
  validateChatSettingsOrThrow,
  validateApiConfigurationOrThrow
} from '../validators.js';

// Mock del logger per evitare di dipendere da VSCode
vi.mock('../../utils/logger', () => ({
  Logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }
}));

// Path to the examples directory
const examplesDir = path.resolve(__dirname, '../../../examples');

// Function to read a JSON file
function readJsonFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

// Test cases configuration
type TestCase = {
  schemaType: string;
  validator: (data: unknown) => boolean;
  strictValidator: (data: unknown) => unknown;
  exampleGlob: string;
};

const testCases: TestCase[] = [
  {
    schemaType: 'ChatMessage',
    validator: isValidChatMessage,
    strictValidator: validateChatMessageOrThrow,
    exampleGlob: 'chat_message.json',
  },
  {
    schemaType: 'ChatMessageArray',
    validator: isValidChatMessageArray,
    strictValidator: validateChatMessageArrayOrThrow,
    exampleGlob: 'chat_messages.json',
  },
  {
    schemaType: 'ChatSettings',
    validator: isValidChatSettings,
    strictValidator: validateChatSettingsOrThrow,
    exampleGlob: 'chat_settings*.json',
  },
  {
    schemaType: 'ApiConfiguration',
    validator: isValidApiConfiguration,
    strictValidator: validateApiConfigurationOrThrow,
    exampleGlob: 'api_config*.json',
  },
];

// Function to get example files matching a glob pattern
function getExampleFiles(glob: string): string[] {
  const files = fs.readdirSync(examplesDir)
    .filter(file => {
      // Simple glob matching (supports only * wildcard)
      const pattern = glob.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(file);
    })
    .map(file => path.join(examplesDir, file));
  
  return files;
}

describe('Schema and Validator alignment', () => {
  // Test that all example files are correctly validated
  testCases.forEach(({ schemaType, validator, strictValidator, exampleGlob }) => {
    describe(`${schemaType} validation`, () => {
      const exampleFiles = getExampleFiles(exampleGlob);
      
      if (exampleFiles.length === 0) {
        it.todo(`No example files found for ${schemaType} (${exampleGlob})`);
        return;
      }
      
      exampleFiles.forEach(filePath => {
        const fileName = path.basename(filePath);
        
        it(`validates example file ${fileName}`, () => {
          const data = readJsonFile(filePath);
          expect(validator(data)).toBe(true);
        });
        
        it(`strict validates example file ${fileName} without throwing`, () => {
          const data = readJsonFile(filePath);
          expect(() => strictValidator(data)).not.toThrow();
        });
      });
      
      it(`has consistent schema for ${schemaType}`, () => {
        // Ensure the schema exists and is properly loaded
        expect(validator).toBeDefined();
        expect(strictValidator).toBeDefined();
        expect(typeof validator).toBe('function');
        expect(typeof strictValidator).toBe('function');
      });
    });
  });
}); 