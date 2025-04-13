import Parser from 'web-tree-sitter';
import { join } from 'path';
import {
  javascriptQuery,
  typescriptQuery,
  pythonQuery,
  rustQuery,
  goQuery,
  cppQuery,
  cQuery,
  csharpQuery,
  rubyQuery,
  javaQuery,
  phpQuery,
  swiftQuery,
  kotlinQuery,
} from './queries';

export interface LanguageParser {
  parser: Parser;
  language: Parser.Language;
}

async function loadLanguage(langName: string) {
  return await Parser.Language.load(join(__dirname, `tree-sitter-${langName}.wasm`));
}

let isParserInitialized = false;

async function initializeParser() {
  if (!isParserInitialized) {
    await Parser.init();
    isParserInitialized = true;
  }
}

/*
Using node bindings for tree-sitter is problematic in vscode extensions 
because of incompatibility with electron. Going the .wasm route has the 
advantage of not having to build for multiple architectures.

We use web-tree-sitter and tree-sitter-wasms which provides auto-updating prebuilt WASM binaries for tree-sitter's language parsers.

This function loads WASM modules for relevant language parsers based on input files:
1. Extracts unique file extensions
2. Maps extensions to language names
3. Loads corresponding WASM files (containing grammar rules)
4. Uses WASM modules to initialize tree-sitter parsers

This approach optimizes performance by loading only necessary parsers once for all relevant files.

Sources:
- https://github.com/tree-sitter/node-tree-sitter/issues/169
- https://github.com/tree-sitter/node-tree-sitter/issues/168
- https://github.com/Gregoor/tree-sitter-wasms/blob/main/README.md
- https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/README.md
- https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/test/query-test.js
*/
export async function loadRequiredLanguageParsers(): Promise<LanguageParser[]> {
  const parsers: LanguageParser[] = [];
  const languages = ['javascript', 'typescript', 'python', 'java', 'cpp'];

  for (const lang of languages) {
    try {
      const parser = await loadLanguageParser(lang);
      if (parser) {
        parsers.push(parser);
      }
    } catch (error) {
      console.error(`Failed to load ${lang} parser:`, error);
    }
  }

  return parsers;
}

async function loadLanguageParser(langName: string): Promise<LanguageParser | null> {
  try {
    const parser = new Parser();
    const language = await Parser.Language.load(join(__dirname, `tree-sitter-${langName}.wasm`));
    parser.setLanguage(language);
    return { parser, language };
  } catch (error) {
    console.error(`Failed to load ${langName} parser:`, error);
    return null;
  }
}
