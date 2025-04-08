import * as fs from "fs/promises";
import * as path from "path";
// Mock di vscode per ambienti non-VS Code
const mockVscode = {
    workspace: {
        workspaceFolders: null
    }
};
// Usa il vscode reale se disponibile, altrimenti usa il mock
const vscodeMod = typeof vscode !== 'undefined' ? vscode : mockVscode;
/**
 * Handler per il comando read_file
 * @param args Argomenti per la lettura del file
 * @returns Contenuto del file o null in caso di errore
 */
export async function readFileHandler(args) {
    const filePath = args?.path;
    if (!filePath || typeof filePath !== "string") {
        throw new Error("Parametro 'path' mancante o non valido");
    }
    try {
        // Ottieni il percorso workspace
        let workspacePath = process.cwd(); // Default al percorso corrente
        // Se c'è un workspace VS Code aperto, usalo invece
        if (vscodeMod.workspace.workspaceFolders && vscodeMod.workspace.workspaceFolders.length > 0) {
            workspacePath = vscodeMod.workspace.workspaceFolders[0].uri.fsPath;
        }
        const absPath = path.resolve(workspacePath, filePath);
        // Verifica che il file esista
        const stats = await fs.stat(absPath);
        if (!stats.isFile()) {
            throw new Error(`Il percorso specificato non è un file: ${filePath}`);
        }
        // Legge il contenuto del file
        const content = await fs.readFile(absPath, "utf-8");
        return content;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File non trovato: ${filePath}`);
        }
        throw error;
    }
}
//# sourceMappingURL=readFileHandler.js.map