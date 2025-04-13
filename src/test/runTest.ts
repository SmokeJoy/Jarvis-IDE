import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    // Il percorso root dell'estensione
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // Il percorso dei test
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Scarica VS Code, installa le dipendenze e esegui i test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions'],
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
