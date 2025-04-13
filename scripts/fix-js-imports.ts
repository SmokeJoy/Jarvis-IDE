import fs from 'fs';
import path from 'path';

const root = './src';

function fixFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fixed = content.replace(
    /(from\s+['"]\.{1,2}.*?)(\.js)(['"])/g,
    (_, p1, _p2, p3) => `${p1}${p3}`
  );

  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed, 'utf-8');
    console.log(`🛠️ Fixed imports in ${filePath}`);
  }
}

function walk(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) fixFile(fullPath);
  }
}

walk(root); 