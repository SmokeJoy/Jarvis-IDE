/**
 * @file projectSummaryHandler.ts
 * @description Handler per lo strumento project.summary
 *
 * Questo handler genera un riepilogo del progetto che include
 * la struttura delle directory, informazioni sui file chiave
 * e una breve descrizione del progetto.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
// Mock di vscode per ambienti non-VS Code
interface MockVscode {
  workspace: {
    workspaceFolders: null;
  };
}
const mockVscode: MockVscode = {
  workspace: {
    workspaceFolders: null,
  },
};
// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;
// Directory da escludere dalla scansione
const EXCLUDED_DIRS: string[] = ['node_modules', '.git', 'dist', 'build', '.vscode', 'out'];
// Estensioni di file considerate chiave
const KEY_FILE_EXTENSIONS: string[] = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];
/**
 * Scansiona ricorsivamente una directory e restituisce la sua struttura in formato Markdown
 * @param dirPath Percorso della directory da scansionare
 * @param depth Profondità massima di scansione
 * @param currentDepth Profondità corrente (usato internamente per la ricorsione)
 * @returns Struttura della directory in formato Markdown
 */
async function scanDirectory(
  dirPath: string,
  depth: number,
  currentDepth: number = 0
): Promise<string> {
  if (currentDepth > depth) {
    return '';
  }
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    // Filtra le entries escludendo le directory non desiderate
    const filteredEntries = entries.filter((entry) => {
      if (entry.isDirectory() && EXCLUDED_DIRS.includes(entry.name)) {
        return false;
      }
      return true;
    });
    // Ordina le entries: prima le directory, poi i file
    filteredEntries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    // Genera la struttura in Markdown
    let result = '';
    for (const entry of filteredEntries) {
      try {
        const indent = '  '.repeat(currentDepth);
        const entryPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          if (currentDepth === 0) {
            // Per le directory di primo livello, aggiungi un titolo
            result += `\n### Directory: ${entry.name}/\n`;
          } else {
            // Per le directory annidate, usa indentazione
            result += `${indent}- 📁 ${entry.name}/\n`;
          }
          // Scansiona ricorsivamente se non abbiamo raggiunto la profondità massima
          if (currentDepth < depth) {
            const subdirContent = await scanDirectory(entryPath, depth, currentDepth + 1);
            result += subdirContent;
          }
        } else {
          // Aggiungi solo i file nella directory root o specificatamente richiesti
          if (currentDepth > 0 || (currentDepth === 0 && isKeyFile(entry.name))) {
            result += `${indent}- 📄 ${entry.name}\n`;
          }
        }
      } catch (entryError: any) {
        // Gestisce errori per singole entry (problemi di permessi, file temporanei scomparsi, ecc.)
        console.error(`Errore nell'elaborazione di ${path.join(dirPath, entry.name)}:`, entryError);
        const indent = '  '.repeat(currentDepth);
        result += `${indent}- ⚠️ ${entry.name} (accesso non riuscito: ${entryError.message})\n`;
      }
    }
    return result;
  } catch (error: any) {
    console.error(`Errore durante la scansione della directory ${dirPath}:`, error);
    return `\nErrore nella scansione di ${dirPath}: ${error.message}\n`;
  }
}
/**
 * Verifica se un file è considerato un file chiave
 * @param fileName Nome del file da verificare
 * @returns true se il file è un file chiave
 */
function isKeyFile(fileName: string): boolean {
  const ext = path.extname(fileName);
  if (KEY_FILE_EXTENSIONS.includes(ext)) {
    return true;
  }
  // Considera chiave anche questi file specifici
  const keyFiles: string[] = [
    'package.json',
    'tsconfig.json',
    'README.md',
    'LICENSE',
    '.gitignore',
    '.npmignore',
    '.eslintrc',
    '.prettierrc',
    'webpack.config.js',
    'rollup.config.js',
    'vite.config.js',
  ];
  return keyFiles.includes(fileName);
}
/**
 * Ottiene informazioni su un file
 * @param filePath Percorso del file
 * @returns Descrizione del file in formato Markdown
 */
async function getFileInfo(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const fileExt = path.extname(filePath);
    // Cerca commenti all'inizio del file per la descrizione
    let description = '';
    // Cerca JSDoc o commenti multipla riga all'inizio
    const jsdocMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    if (jsdocMatch) {
      // Estrai solo il testo senza asterischi
      description = jsdocMatch[0]
        .replace(/\/\*\*|\*\//g, '')
        .replace(/^\s*\*\s*/gm, '')
        .trim();
    } else {
      // Se non ci sono commenti JSDoc, cerca altre forme di commenti/descrizioni
      // Per file package.json, cerca name e description
      if (filename === 'package.json') {
        try {
          const pkg = JSON.parse(content);
          description = `Package: ${pkg.name || 'sconosciuto'}\n${pkg.description || 'Nessuna descrizione nel package.json'}\nVersione: ${pkg.version || 'non specificata'}`;
        } catch (e: any) {
          description = `File JSON non valido o incompleto: ${e.message}`;
        }
      }
      // Per i README, prova a estrarre i primi paragrafi
      else if (filename.toLowerCase().includes('readme')) {
        const firstParagraphs = content.split('\n\n').slice(0, 2).join('\n\n');
        description =
          firstParagraphs.length > 0
            ? firstParagraphs
            : 'Contenuto README senza paragrafi distinguibili';
      }
      // Per file di codice, cerca commenti in cima o descrizione di classe/funzione
      else if (['.ts', '.js', '.tsx', '.jsx'].includes(fileExt)) {
        const lineComments = content.match(/^\/\/.*$/m);
        if (lineComments) {
          description = lineComments[0].replace(/^\/\/\s*/, '');
        } else {
          const classOrFunctionMatch = content.match(
            /(?:export\s+)?(?:class|function|const|interface)\s+(\w+)/
          );
          description = classOrFunctionMatch
            ? `Definisce ${classOrFunctionMatch[0]}`
            : `File ${fileExt.replace('.', '')} senza commenti o dichiarazioni principali evidenti`;
        }
      } else {
        // Fallback generico
        description = `File ${fileExt || 'senza estensione'} - Primi ${Math.min(300, content.length)} caratteri`;
        description += '\n\n' + content.substring(0, 300) + (content.length > 300 ? '...' : '');
      }
    }
    // Formatta la descrizione in markdown
    return `#### 📄 ${filename}\n\n\`\`\`\n${description}\n\`\`\`\n\n`;
  } catch (error: any) {
    console.error(`Errore durante l'analisi del file ${filePath}:`, error);
    return `#### 📄 ${path.basename(filePath)}\n\n*Errore durante l'analisi del file: ${error.message}*\n\n`;
  }
}
/**
 * Trova e analizza i file chiave del progetto
 * @param workspaceRoot Percorso root del workspace
 * @returns Analisi dei file chiave in formato Markdown
 */
async function analyzeKeyFiles(workspaceRoot: string): Promise<string> {
  try {
    let result = '## File Chiave\n\n';
    // Controlla se esiste una directory src
    const srcPath = path.join(workspaceRoot, 'src');
    let srcExists = false;
    try {
      const srcStat = await fs.stat(srcPath);
      srcExists = srcStat.isDirectory();
    } catch (e) {
      // La directory src non esiste
    }
    // File da analizzare nella root
    const rootFilesToAnalyze: string[] = ['package.json', 'tsconfig.json', 'README.md'];
    // Analizza i file nella root
    for (const file of rootFilesToAnalyze) {
      const filePath = path.join(workspaceRoot, file);
      try {
        await fs.access(filePath);
        result += await getFileInfo(filePath);
      } catch (e) {
        // File non esiste, salta
      }
    }
    // Se esiste src, analizza anche alcuni file lì
    if (srcExists) {
      // Trova i file principali in src (come index.ts)
      const srcFiles = await fs.readdir(srcPath);
      const mainFiles = srcFiles.filter(
        (f) => f === 'index.ts' || f === 'main.ts' || f === 'app.ts' || f === 'extension.ts'
      );
      for (const file of mainFiles) {
        const filePath = path.join(srcPath, file);
        result += await getFileInfo(filePath);
      }
    }
    return result;
  } catch (error: any) {
    console.error("Errore durante l'analisi dei file chiave:", error);
    return "## File Chiave\n\n*Errore durante l'analisi dei file chiave*\n\n";
  }
}
/**
 * Ottiene la descrizione del progetto dal README o package.json
 * @param workspaceRoot Percorso root del workspace
 * @returns Descrizione del progetto in formato Markdown
 */
async function getProjectDescription(workspaceRoot: string): Promise<string> {
  try {
    // Prima prova a leggere dal README.md
    const readmePath = path.join(workspaceRoot, 'README.md');
    try {
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      // Estrai il titolo e i primi paragrafi dal README
      const titleMatch = readmeContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'Progetto';
      // Prendi i primi 500 caratteri dopo il titolo come descrizione
      let description = readmeContent
        .replace(/^#\s+.+$/m, '') // Rimuovi il titolo
        .trim()
        .substring(0, 500);
      if (description.length === 500) {
        description += '...';
      }
      return `# ${title}\n\n${description}\n\n`;
    } catch (e) {
      // README non trovato, prova con package.json
      const packagePath = path.join(workspaceRoot, 'package.json');
      try {
        const packageContent = await fs.readFile(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent);
        const name = packageJson.name || 'Progetto';
        const description = packageJson.description || 'Nessuna descrizione disponibile';
        return `# ${name}\n\n${description}\n\n`;
      } catch (pkgErr) {
        // Nessun README o package.json trovato, fornisci un titolo basato sulla cartella
        const folderName = path.basename(workspaceRoot);
        return `# Progetto ${folderName}\n\n*Nessuna descrizione disponibile nei file README.md o package.json*\n\n`;
      }
    }
  } catch (error: any) {
    console.error('Errore durante la lettura della descrizione del progetto:', error);
    return '# Riepilogo Progetto\n\n*Informazioni sul progetto non disponibili*\n\n';
  }
}
/**
 * Interfaccia per gli argomenti del handler
 */
interface ProjectSummaryArgs {
  depth?: number;
  includeFiles?: boolean;
}
/**
 * Handler principale per la generazione del riepilogo del progetto
 * @param args Argomenti per la generazione del riepilogo
 * @returns Riepilogo del progetto in formato Markdown
 */
export async function projectSummaryHandler(args: ProjectSummaryArgs): Promise<string> {
  try {
    // Ottieni la cartella del workspace
    let workspaceRoot = process.cwd(); // Default al percorso corrente
    // Se c'è un workspace VS Code aperto, usalo invece
    if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
      workspaceRoot = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
    }
    // Imposta valori predefiniti
    const depth = args.depth !== undefined ? args.depth : 2;
    const includeFiles = args.includeFiles !== undefined ? args.includeFiles : true;
    // Ottieni la descrizione del progetto
    let summary = await getProjectDescription(workspaceRoot);
    // Aggiungi la struttura delle directory
    summary += '## Struttura del Progetto\n';
    summary += await scanDirectory(workspaceRoot, depth);
    // Aggiungi l'analisi dei file se richiesto
    if (includeFiles) {
      summary += await analyzeKeyFiles(workspaceRoot);
    }
    return summary;
  } catch (error: any) {
    console.error('Errore durante la generazione del riepilogo del progetto:', error);
    throw new Error(`Errore durante la generazione del riepilogo del progetto: ${error.message}`);
  }
}
//# sourceMappingURL=projectSummaryHandler.js.map
