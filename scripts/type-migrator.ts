/**
 * @file type-migrator.ts
 * @description Script per migrare automaticamente i tipi duplicati
 */

import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { File, Node } from '@babel/types';

interface TypeDefinition {
  name: string;
  file: string;
  content: string;
  type: 'interface' | 'type' | 'enum';
}

const root = './src';
const typeDefinitions = new Map<string, TypeDefinition[]>();
const targetFiles = {
  provider: path.join(root, 'types', 'provider.types.ts'),
  api: path.join(root, 'types', 'api.types.ts'),
  fallback: path.join(root, 'types', 'fallback.types.ts'),
  webview: path.join(root, 'types', 'webview.types.ts'),
  settings: path.join(root, 'types', 'settings.types.ts'),
  metrics: path.join(root, 'types', 'metrics.types.ts'),
  telemetry: path.join(root, 'types', 'telemetry.types.ts'),
  mas: path.join(root, 'types', 'mas.types.ts'),
  testUtils: path.join(root, 'types', 'test-utils.types.ts')
};

function getTargetFile(typeName: string): string {
  // Logica per determinare il file target in base al nome del tipo
  if (typeName.includes('Provider') || typeName.includes('Model')) {
    return targetFiles.provider;
  }
  if (typeName.includes('Api') || typeName.includes('Request') || typeName.includes('Response')) {
    return targetFiles.api;
  }
  if (typeName.includes('Fallback') || typeName.includes('Event')) {
    return targetFiles.fallback;
  }
  if (typeName.includes('Webview') || typeName.includes('Message')) {
    return targetFiles.webview;
  }
  if (typeName.includes('Settings') || typeName.includes('Config')) {
    return targetFiles.settings;
  }
  if (typeName.includes('Metrics') || typeName.includes('Score')) {
    return targetFiles.metrics;
  }
  if (typeName.includes('Telemetry') || typeName.includes('Tracker')) {
    return targetFiles.telemetry;
  }
  if (typeName.includes('Agent') || typeName.includes('Task')) {
    return targetFiles.mas;
  }
  if (typeName.includes('Mock') || typeName.includes('Test')) {
    return targetFiles.testUtils;
  }
  return targetFiles.provider; // Default
}

function extractTypeContent(node: Node): string {
  return generate(node).code;
}

function analyzeFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });

  traverse(ast, {
    TSInterfaceDeclaration(nodePath) {
      const name = nodePath.node.id.name;
      const definition: TypeDefinition = {
        name,
        file: filePath,
        content: extractTypeContent(nodePath.node),
        type: 'interface'
      };
      
      if (!typeDefinitions.has(name)) {
        typeDefinitions.set(name, []);
      }
      typeDefinitions.get(name)?.push(definition);
    },
    TSTypeAliasDeclaration(nodePath) {
      const name = nodePath.node.id.name;
      const definition: TypeDefinition = {
        name,
        file: filePath,
        content: extractTypeContent(nodePath.node),
        type: 'type'
      };
      
      if (!typeDefinitions.has(name)) {
        typeDefinitions.set(name, []);
      }
      typeDefinitions.get(name)?.push(definition);
    },
    TSEnumDeclaration(nodePath) {
      const name = nodePath.node.id.name;
      const definition: TypeDefinition = {
        name,
        file: filePath,
        content: extractTypeContent(nodePath.node),
        type: 'enum'
      };
      
      if (!typeDefinitions.has(name)) {
        typeDefinitions.set(name, []);
      }
      typeDefinitions.get(name)?.push(definition);
    }
  });
}

function walk(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('types')) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      analyzeFile(fullPath);
    }
  }
}

// Esegui l'analisi
walk(root);

// Migra i tipi duplicati
for (const [name, definitions] of typeDefinitions.entries()) {
  if (definitions.length > 1) {
    const targetFile = getTargetFile(name);
    const content = definitions[0].content;
    
    // Aggiungi il tipo al file target
    fs.appendFileSync(targetFile, `\n${content}\n`);
    console.log(`✅ Migrato ${name} a ${targetFile}`);
    
    // Rimuovi il tipo dai file sorgente
    definitions.forEach(def => {
      if (def.file !== targetFile) {
        const fileContent = fs.readFileSync(def.file, 'utf-8');
        const newContent = fileContent.replace(def.content, '');
        fs.writeFileSync(def.file, newContent);
        console.log(`   - Rimosso da ${def.file}`);
      }
    });
  }
}

console.log('\n🎉 Migrazione completata!'); 