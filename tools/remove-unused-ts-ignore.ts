import fg from 'fast-glob';
import fs from 'fs/promises';

async function main() {
  const files = await fg(['src/**/*.{ts,tsx}', 'webview-ui/src/**/*.{ts,tsx}'], { dot: true });

  for (const file of files) {
    let content = await fs.readFile(file, 'utf8');
    const original = content;
    content = content.replace(/\/\/\s*@ts-ignore[^\n]*\n\s*\n/g, ''); // rimuove linee isolate
    content = content.replace(/\/\/\s*@ts-ignore[^\n]*\n(?=\s*[^/])/g, ''); // riga + successiva valida
    if (content !== original) {
      await fs.writeFile(file, content);
      console.log(`✂️ Cleaned: ${file}`);
    }
  }
}

main().catch(err => {
  console.error('❌ Error during script execution:', err);
  process.exit(1);
}); 