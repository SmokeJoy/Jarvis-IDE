import fs from 'fs';
import path from 'path';

const root = './src';
const badImports = [];

function scan(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (line.match(/from ['"].*\.js['"]/)) {
      badImports.push({ file: filePath, line: index + 1, content: line });
    }
  });
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) scan(fullPath);
  }
}

walk(root);

if (badImports.length) {
  console.error('⛔ Invalid .js imports found:');
  badImports.forEach(({ file, line, content }) =>
    console.error(`❌ ${file}:${line} → ${content}`)
  );
  process.exit(1);
} else {
  console.log('✅ No .js import issues found.');
} 