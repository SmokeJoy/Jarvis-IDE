import fg from 'fast-glob';
import fs from 'fs';

(async () => {
  const files = await fg(['webview-ui/**/*.ts', 'src/**/*.ts'], { dot: false });
  const unsafeUsages: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const hasPayloadAccess = /payload\s*\.\s*[a-zA-Z]+/.test(content);
    const hasGuard = /is[A-Z][a-zA-Z]+Message/.test(content);
    if (hasPayloadAccess && !hasGuard) {
      unsafeUsages.push(file);
    }
  }

  if (unsafeUsages.length === 0) {
    console.log('✅ Nessun uso payload non protetto trovato');
  } else {
    console.log('⚠️ Possibly unsafe message usage in:');
    unsafeUsages.forEach((f) => console.log(' →', f));
    process.exitCode = 1;
  }
})(); 