/**
 * @file type-analyzer.ts
 * @description Script per analizzare i tipi duplicati nel progetto
 */

import fs from 'fs';
import path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';
import { TSESTree } from '@typescript-eslint/typescript-estree';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const traverse = require('@babel/traverse').default;

interface TypeDefinition {
  name: string;
  file: string;
  line: number;
  type: 'interface' | 'type' | 'enum';
}

interface DuplicateType {
  name: string;
  definitions: TypeDefinition[];
}

const root = './src';
const typeDefinitions = new Map<string, TypeDefinition[]>();
const duplicates: DuplicateType[] = [];

function analyzeFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ast = parse(content, {
    sourceType: 'module',
    jsx: true
  });

  function visitNode(node: TSESTree.Node) {
    if (node.type === 'TSInterfaceDeclaration') {
      registerType(node.id.name, filePath, node.loc?.start.line || 0, 'interface');
    } else if (node.type === 'TSTypeAliasDeclaration') {
      registerType(node.id.name, filePath, node.loc?.start.line || 0, 'type');
    } else if (node.type === 'TSEnumDeclaration') {
      registerType(node.id.name, filePath, node.loc?.start.line || 0, 'enum');
    }

    // Visita i nodi figli
    for (const key in node) {
      const value = (node as any)[key];
      if (value && typeof value === 'object' && 'type' in value) {
        visitNode(value);
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === 'object' && 'type' in item) {
            visitNode(item);
          }
        });
      }
    }
  }

  visitNode(ast);
}

function registerType(name: string, file: string, line: number, type: 'interface' | 'type' | 'enum') {
  const definition: TypeDefinition = { name, file, line, type };
  if (!typeDefinitions.has(name)) {
    typeDefinitions.set(name, []);
  }
  typeDefinitions.get(name)!.push(definition);
}

function walk(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules')) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      analyzeFile(fullPath);
    }
  }
}

walk(root);

for (const [name, definitions] of typeDefinitions.entries()) {
  if (definitions.length > 1) {
    duplicates.push({ name, definitions });
  }
}

if (duplicates.length > 0) {
  console.log('🔍 Tipi duplicati trovati:');
  duplicates.forEach(({ name, definitions }) => {
    console.log(`\n❌ ${name}:`);
    definitions.forEach(def => {
      console.log(`   - ${def.file}:${def.line} (${def.type})`);
    });
  });
  process.exit(1);
} else {
  console.log('✅ Nessun tipo duplicato trovato!');
  process.exit(0);
} 