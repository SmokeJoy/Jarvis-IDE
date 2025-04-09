import * as fs from 'fs';
import * as path from 'path';

export function loadDocsFromFolder(): string {
  const docsPath = path.resolve(__dirname, '../../../docs');
  let content = '';

  if (!fs.existsSync(docsPath)) return content;

  for (const file of fs.readdirSync(docsPath)) {
    if (file.endsWith('.md') || file.endsWith('.txt')) {
      const filePath = path.join(docsPath, file);
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        content += `\n\n# File: ${file}\n` + fileContent;
      } catch (err) {
        console.warn(`⚠️ Impossibile leggere ${file}:`, err);
      }
    }
  }

  return content;
} 