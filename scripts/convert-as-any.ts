import fs from 'fs';
import path from 'path';

const baseDir = 'src/';
const zodImport = `import { z } from 'zod';\n`;

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (file.endsWith('.ts') || file.endsWith('.tsx')) transform(full);
  }
}

function transform(filePath: string) {
  let code = fs.readFileSync(filePath, 'utf8');
  if (!code.includes(' as any')) return;

  // Aggiungi import Zod se non presente
  if (!code.includes("from 'zod'")) {
    code = zodImport + code;
  }

  // Sostituisci tutti i cast message.payload as any con PayloadSchema.parse(message.payload)
  code = code.replace(/message\.payload as any/g, 'PayloadSchema.parse(message.payload)');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Refactored:', filePath);
}

walk(baseDir); 