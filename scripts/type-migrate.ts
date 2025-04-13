import fs from 'fs';
import path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';
import { TSESTree } from '@typescript-eslint/typescript-estree';
import chalk from 'chalk';

interface TypeDefinition {
  name: string;
  file: string;
  line: number;
  content: string;
  type: 'interface' | 'type' | 'enum';
}

const root = './src';
const typesRoot = path.join(root, 'types');
const collected = new Map<string, TypeDefinition[]>();

// Mappa logica di destinazione per categoria di tipo
const fileTargets: Record<string, string> = {
  Provider: 'provider.types.ts',
  Model: 'provider.types.ts',
  Fallback: 'fallback.types.ts',
  Message: 'webview.types.ts',
  Webview: 'webview.types.ts',
  Settings: 'settings.types.ts',
  Config: 'settings.types.ts',
  Metrics: 'metrics.types.ts',
  Telemetry: 'telemetry.types.ts',
  Agent: 'mas.types.ts',
  Task: 'mas.types.ts',
  Mock: 'test-utils.types.ts',
  Test: 'test-utils.types.ts',
};

function getTargetFile(typeName: string): string {
  for (const key in fileTargets) {
    if (typeName.includes(key)) return path.join(typesRoot, fileTargets[key]);
  }
  return path.join(typesRoot, 'provider.types.ts');
}

function extractContent(lines: string[], start: number): string {
  const maxLines = 100;
  const code: string[] = [];
  let opened = 0;
  for (let i = start; i < lines.length && i < start + maxLines; i++) {
    const line = lines[i];
    code.push(line);
    opened += (line.match(/{/g) || []).length;
    opened -= (line.match(/}/g) || []).length;
    if (opened <= 0 && line.includes('}')) break;
  }
  return code.join('\n');
}

function analyzeFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  const ast = parse(raw, { jsx: true, loc: true });

  function visit(node: TSESTree.Node) {
    if (
      node.type === 'TSInterfaceDeclaration' ||
      node.type === 'TSTypeAliasDeclaration' ||
      node.type === 'TSEnumDeclaration'
    ) {
      const name = node.id.name;
      const line = node.loc?.start.line ?? 0;
      const content = extractContent(lines, line - 1);
      const type: TypeDefinition = {
        name,
        file: filePath,
        line,
        content,
        type: node.type === 'TSTypeAliasDeclaration' ? 'type' :
              node.type === 'TSInterfaceDeclaration' ? 'interface' : 'enum'
      };

      if (!collected.has(name)) collected.set(name, []);
      collected.get(name)!.push(type);
    }

    for (const key in node) {
      const child = (node as any)[key];
      if (Array.isArray(child)) {
        child.forEach(c => c?.type && visit(c));
      } else if (child?.type) {
        visit(child);
      }
    }
  }

  visit(ast);
}

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (!fullPath.includes('/types/')) analyzeFile(fullPath);
    }
  }
}

walk(root);

// MIGRAZIONE
console.log(chalk.cyan('\n🚚 Migrazione tipi duplicati...\n'));

for (const [name, defs] of collected.entries()) {
  if (defs.length <= 1) continue;

  const target = getTargetFile(name);
  const first = defs[0];

  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, `// ${path.basename(target)}\n`, 'utf8');
  }

  fs.appendFileSync(target, `\n${first.content}\n`);
  console.log(`✅ ${chalk.green(name)} → ${chalk.yellow(path.basename(target))}`);

  for (const def of defs.slice(1)) {
    const lines = fs.readFileSync(def.file, 'utf8').split('\n');
    const startIdx = def.line - 1;
    const extracted = extractContent(lines, startIdx).split('\n').length;

    const newLines = lines
      .slice(0, startIdx)
      .concat(lines.slice(startIdx + extracted));

    fs.writeFileSync(def.file, newLines.join('\n'), 'utf8');
    console.log(`   🧹 ${chalk.gray('Rimosso da')} ${path.relative('.', def.file)}`);
  }
}

console.log(chalk.bold.green('\n🎉 Migrazione completata con successo!')); 