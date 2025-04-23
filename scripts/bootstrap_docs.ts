import { promises as fs } from 'fs';
import { join } from 'path';

async function ensureDir(path: string) {
  await fs.mkdir(path, { recursive: true });
}

async function ensureFile(path: string, content = '') {
  await fs.writeFile(path, content, { flag: 'wx' }).catch(() => {});
}

async function main() {
  const root = process.cwd();
  const docsDir = join(root, 'docs');
  const logbookDir = join(docsDir, 'logbook');
  const diariesDir = join(docsDir, 'diaries');
  const notebookDir = join(docsDir, 'notebooklm');

  await ensureDir(logbookDir);
  await ensureDir(diariesDir);
  await ensureDir(notebookDir);

  // Logbook files
  await ensureFile(join(logbookDir, 'AI1.md'), '# Logbook AI1\n');
  await ensureFile(join(logbookDir, 'AI2.md'), '# Logbook AI2\n');
  await ensureFile(join(logbookDir, 'UMANO.md'), '# Logbook UMANO\n');

  // Diaries files
  const diaryFiles = [
    'dev-ai1.md',
    'dev-ai2.md',
    'comms.md',
    'doc.md',
    'bug.md',
    'security.md',
    'supervisor-1.md',
  ];
  for (const file of diaryFiles) {
    await ensureFile(join(diariesDir, file), `# Diario ${file.replace('.md', '')}\n`);
  }

  // Notebook files
  const notebookFiles = [
    'agent-system.md',
    'orchestrators.md',
    'test-strategy.md',
    'decision-history.md',
  ];
  for (const file of notebookFiles) {
    await ensureFile(join(notebookDir, file), `# ${file.replace('.md', '')}\n`);
  }

  // Root docs files
  await ensureFile(join(docsDir, 'albero-progetto.md'), '# Albero Progetto\n');
  await ensureFile(join(docsDir, 'protocollo-operativo.md'), '# Protocollo Operativo\n');

  console.log('Docs structure bootstrapped successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 